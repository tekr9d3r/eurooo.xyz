/**
 * Drives the real route entry points that Vercel deploys, with only the network
 * stubbed. Catches wiring mistakes that handler-level tests cannot see, such as
 * a dynamic segment not reaching its handler.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

import yieldsRoute from '../../v1/yields';
import yieldByIdRoute from '../../v1/yields/[id]';
import yieldHistoryRoute from '../../v1/yields/[id]/history';
import assetsRoute from '../../v1/assets';
import statusRoute from '../../v1/status';
import openapiRoute from '../../v1/openapi';
import notFoundRoute from '../../v1/notfound';
import { sharedRateLimiter } from '../ratelimit';
import type { VercelRequest, VercelResponse } from '../vercel';

const SNAPSHOT_ROWS = [
  { pool_key: 'aaveBase', apy: '4.82', tvl: '12500000', fetched_at: '2026-10-03T11:00:00+00:00' },
  { pool_key: 'aaveBase', apy: '5.00', tvl: '12000000', fetched_at: '2026-10-03T10:00:00+00:00' },
  { pool_key: 'fluidBase', apy: '2.77', tvl: '2768000', fetched_at: '2026-10-03T11:00:00+00:00' },
];

function makeRes() {
  const state = { statusCode: 0, headers: {} as Record<string, string>, body: '' };
  const res = {
    setHeader: (name: string, value: string) => {
      state.headers[name] = value;
    },
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    send(body: string) {
      state.body = body;
    },
    end() {},
  };
  return { res: res as unknown as VercelResponse, state };
}

function makeReq(query: Record<string, string> = {}): VercelRequest {
  return {
    method: 'GET',
    url: '/api/v1/test',
    headers: { 'x-vercel-forwarded-for': '203.0.113.9' },
    query,
  };
}

async function call(
  route: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  query: Record<string, string> = {}
) {
  const { res, state } = makeRes();
  await route(makeReq(query), res);
  return { ...state, json: state.body ? JSON.parse(state.body) : undefined };
}

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');

  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const rows = url.includes('pool_key=eq.aaveBase')
      ? SNAPSHOT_ROWS.filter((r) => r.pool_key === 'aaveBase')
      : url.includes('pool_key=eq.')
        ? []
        : SNAPSHOT_ROWS;
    return new Response(JSON.stringify(rows), { status: 200 });
  });
});

afterAll(() => {
  fetchSpy.mockRestore();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  sharedRateLimiter.reset();
});

describe('deployed routes', () => {
  it('GET /api/v1/yields serves live snapshot data', async () => {
    const { statusCode, headers, json } = await call(yieldsRoute);

    expect(statusCode).toBe(200);
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Cache-Control']).toContain('s-maxage=300');
    expect(headers['X-Api-Version']).toBe('v1');
    expect(json.meta.as_of).toBe('2026-10-03T11:00:00+00:00');

    const aaveBase = json.data.find((r: { id: string }) => r.id === 'aave-base');
    expect(aaveBase.apy).toBe(4.82);
    expect(aaveBase.tvl_usd).toBe(12_500_000);
    expect(aaveBase.data_origin).toBe('snapshot');
  });

  it('GET /api/v1/yields honours filters and pagination', async () => {
    const { json } = await call(yieldsRoute, { chain: 'Base', limit: '3' });

    expect(json.data.length).toBeLessThanOrEqual(3);
    expect(json.pagination.limit).toBe(3);
    for (const record of json.data) expect(record.chain).toBe('Base');
  });

  it('GET /api/v1/yields rejects a bad parameter with 400', async () => {
    const { statusCode, json } = await call(yieldsRoute, { limit: '9999' });

    expect(statusCode).toBe(400);
    expect(json.error.code).toBe('INVALID_PARAMETER');
  });

  it('GET /api/v1/yields/{id} resolves the dynamic segment', async () => {
    const { statusCode, json } = await call(yieldByIdRoute, { id: 'aave-base' });

    expect(statusCode).toBe(200);
    expect(json.data.id).toBe('aave-base');
    expect(json.data.apy).toBe(4.82);
  });

  it('GET /api/v1/yields/{id} returns 404 for an unknown id', async () => {
    const { statusCode, json } = await call(yieldByIdRoute, { id: 'nope' });

    expect(statusCode).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/yields/{id}/history returns a time series', async () => {
    const { statusCode, json } = await call(yieldHistoryRoute, { id: 'aave-base', days: '7' });

    expect(statusCode).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].timestamp < json.data[1].timestamp).toBe(true);
    expect(json.meta.id).toBe('aave-base');
  });

  it('GET /api/v1/assets lists tracked stablecoins', async () => {
    const { statusCode, json } = await call(assetsRoute);

    expect(statusCode).toBe(200);
    expect(json.data.map((a: { symbol: string }) => a.symbol)).toContain('EURC');
  });

  it('GET /api/v1/status reports freshness', async () => {
    const { statusCode, json } = await call(statusRoute);

    expect(statusCode).toBe(200);
    expect(json.data.source).toBe('Eurooo');
    expect(json.data.last_successful_update).toBe('2026-10-03T11:00:00+00:00');
    expect(json.data.tracked_opportunities).toBeGreaterThan(0);
  });

  it('GET /api/v1/openapi serves a valid spec without touching the database', async () => {
    const callsBefore = fetchSpy.mock.calls.length;
    const { statusCode, json } = await call(openapiRoute);

    expect(statusCode).toBe(200);
    expect(json.openapi).toBe('3.0.3');
    expect(json.paths['/api/v1/yields']).toBeDefined();
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
  });

  it('unmatched /api paths return JSON, not the app shell', async () => {
    const { statusCode, headers, json } = await call(notFoundRoute);

    expect(statusCode).toBe(404);
    expect(headers['Content-Type']).toBe('application/json; charset=utf-8');
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('never exposes the database key in a response', async () => {
    for (const route of [yieldsRoute, statusRoute, assetsRoute]) {
      const { body } = await call(route);
      expect(body).not.toContain('test-publishable-key');
      expect(body).not.toContain('test.supabase.co');
    }
  });
});
