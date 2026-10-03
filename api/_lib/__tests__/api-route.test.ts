import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createApiRoute, type VercelRequest, type VercelResponse } from '../vercel.js';
import { jsonResult } from '../http.js';
import { createRateLimiter, DEFAULT_RATE_LIMIT, sharedRateLimiter } from '../ratelimit.js';
import { handleStatus } from '../handlers.js';
import { createSupabaseDataSource, readSupabaseConfig } from '../datasource.js';

interface CapturedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string | undefined;
  ended: boolean;
}

function makeRes(): VercelResponse & CapturedResponse {
  const captured: CapturedResponse = {
    statusCode: 0,
    headers: {},
    body: undefined,
    ended: false,
  };

  const res = {
    ...captured,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: string) {
      this.body = body;
    },
    end() {
      this.ended = true;
    },
  };

  return res as unknown as VercelResponse & CapturedResponse;
}

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    url: '/api/v1/yields',
    headers: { 'x-vercel-forwarded-for': '203.0.113.1' },
    query: {},
    ...overrides,
  };
}

const okRoute = createApiRoute(async (query) => jsonResult({ data: query }));

beforeEach(() => {
  sharedRateLimiter.reset();
});

describe('CORS', () => {
  it('allows cross-origin GET from any origin', async () => {
    const res = makeRes();
    await okRoute(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Content-Type']).toBe('application/json; charset=utf-8');
  });

  it('advertises only read methods, never writes', async () => {
    const res = makeRes();
    await okRoute(makeReq(), res);

    const allowed = res.headers['Access-Control-Allow-Methods'];
    expect(allowed).toBe('GET, HEAD, OPTIONS');
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(allowed).not.toContain(method);
    }
  });

  it('answers preflight with 204 and no body', async () => {
    const res = makeRes();
    await okRoute(makeReq({ method: 'OPTIONS' }), res);

    expect(res.statusCode).toBe(204);
    expect(res.ended).toBe(true);
    expect(res.body).toBeUndefined();
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Max-Age']).toBe('86400');
  });
});

describe('method handling', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects %s with 405', async (method) => {
    const res = makeRes();
    await okRoute(makeReq({ method }), res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET, HEAD, OPTIONS');
    expect(JSON.parse(res.body!).error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('allows HEAD', async () => {
    const res = makeRes();
    await okRoute(makeReq({ method: 'HEAD' }), res);
    expect(res.statusCode).toBe(200);
  });
});

describe('rate limiting', () => {
  it('counts a fixed window and resets after it elapses', () => {
    const limiter = createRateLimiter(3, 1000);

    expect(limiter.check('ip', 0).allowed).toBe(true);
    expect(limiter.check('ip', 10).allowed).toBe(true);
    expect(limiter.check('ip', 20).remaining).toBe(0);

    const blocked = limiter.check('ip', 30);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // A new window begins once the old one has passed.
    expect(limiter.check('ip', 1100).allowed).toBe(true);
  });

  it('tracks clients independently', () => {
    const limiter = createRateLimiter(1, 1000);

    expect(limiter.check('a', 0).allowed).toBe(true);
    expect(limiter.check('a', 1).allowed).toBe(false);
    expect(limiter.check('b', 1).allowed).toBe(true);
  });

  it('returns 429 with Retry-After once the quota is spent', async () => {
    for (let i = 0; i < DEFAULT_RATE_LIMIT; i++) {
      const res = makeRes();
      await okRoute(makeReq(), res);
      expect(res.statusCode).toBe(200);
    }

    const res = makeRes();
    await okRoute(makeReq(), res);

    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body!).error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(Number(res.headers['Retry-After'])).toBeGreaterThan(0);
    expect(res.headers['X-RateLimit-Remaining']).toBe('0');
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('exposes quota headers on successful responses', async () => {
    const res = makeRes();
    await okRoute(makeReq(), res);

    expect(res.headers['X-RateLimit-Limit']).toBe(String(DEFAULT_RATE_LIMIT));
    expect(res.headers['X-RateLimit-Remaining']).toBe(String(DEFAULT_RATE_LIMIT - 1));
    expect(Number(res.headers['X-RateLimit-Reset'])).toBeGreaterThan(0);
  });

  it('does not let one client consume another client\'s quota', async () => {
    for (let i = 0; i < DEFAULT_RATE_LIMIT + 1; i++) {
      await okRoute(makeReq({ headers: { 'x-vercel-forwarded-for': '198.51.100.1' } }), makeRes());
    }

    const res = makeRes();
    await okRoute(makeReq({ headers: { 'x-vercel-forwarded-for': '198.51.100.2' } }), res);
    expect(res.statusCode).toBe(200);
  });
});

describe('failure handling', () => {
  it('converts an unexpected error into a generic 500', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = createApiRoute(async () => {
      throw new Error('connection string postgres://user:secret@host/db');
    });

    const res = makeRes();
    await failing(makeReq(), res);

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body!);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    // The internal detail must not reach the client.
    expect(res.body).not.toContain('secret');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('serves a 500 rather than crashing when the database is unreachable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const route = createApiRoute((_query, ctx) => handleStatus(ctx));

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'test-key');

    const res = makeRes();
    await route(makeReq(), res);

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body!).error.code).toBe('INTERNAL_ERROR');

    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
    consoleError.mockRestore();
  });
});

describe('data source', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requires configuration rather than falling back to a default', () => {
    expect(() => readSupabaseConfig({} as NodeJS.ProcessEnv)).toThrow(/configuration missing/i);
  });

  it('accepts either the server or the build-time variable names', () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: 'https://a.supabase.co/',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'k',
      } as NodeJS.ProcessEnv)
    ).toEqual({ url: 'https://a.supabase.co', key: 'k' });
  });

  it('queries the snapshot table read-only and coerces numeric strings', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { pool_key: 'aaveBase', apy: '4.82', tvl: '12500000', fetched_at: '2026-10-03T11:00:00+00:00' },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const source = createSupabaseDataSource({ url: 'https://a.supabase.co', key: 'k' });
    const rows = await source.getRecentSnapshots();

    expect(rows).toEqual([
      { pool_key: 'aaveBase', apy: 4.82, tvl: 12_500_000, fetched_at: '2026-10-03T11:00:00+00:00' },
    ]);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/rest/v1/protocol_snapshots');
    expect(String(url)).toContain('order=fetched_at.desc');
    expect((init as RequestInit | undefined)?.method ?? 'GET').toBe('GET');
  });

  it('reuses the snapshot read within its memo window', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('[]', { status: 200 }));

    const source = createSupabaseDataSource({ url: 'https://a.supabase.co', key: 'k' });
    await source.getRecentSnapshots();
    await source.getRecentSnapshots();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed read', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(new Response('[]', { status: 200 }));

    const source = createSupabaseDataSource({ url: 'https://a.supabase.co', key: 'k' });

    await expect(source.getRecentSnapshots()).rejects.toThrow(/status 500/);
    await expect(source.getRecentSnapshots()).resolves.toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('scopes a history query to one pool and time range', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('[]', { status: 200 }));

    const source = createSupabaseDataSource({ url: 'https://a.supabase.co', key: 'k' });
    await source.getPoolHistory('aaveBase', '2026-09-03T00:00:00.000Z', '2026-10-03T00:00:00.000Z');

    const url = String(fetchSpy.mock.calls[0][0]);
    expect(url).toContain('pool_key=eq.aaveBase');
    expect(url).toContain('fetched_at=gte.2026-09-03T00%3A00%3A00.000Z');
    expect(url).toContain('fetched_at=lte.2026-10-03T00%3A00%3A00.000Z');
  });
});
