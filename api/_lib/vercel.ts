/**
 * Adapter between Vercel's serverless signature and the runtime-agnostic
 * handlers. Owns the cross-cutting concerns: preflight, method allowlist,
 * rate limiting, and turning unexpected failures into clean JSON.
 */

import {
  ConfigurationError,
  createSupabaseDataSource,
  UpstreamError,
  type YieldDataSource,
} from './datasource.js';
import type { HandlerContext } from './handlers.js';
import { errorResult, preflightResult, type ApiResult } from './http.js';
import { rateLimitHeaders, sharedRateLimiter } from './ratelimit.js';

/**
 * Minimal structural types for the Vercel Node signature. Declared locally so
 * the API needs no build-time dependency on @vercel/node; the platform supplies
 * the runtime and only requires a default-exported (req, res) handler.
 */
export interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

export interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  send(body: string): void;
  end(): void;
}

export type RouteQuery = Record<string, string | undefined>;
export type RouteHandler = (query: RouteQuery, ctx: HandlerContext) => Promise<ApiResult>;

const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS'];

let cachedDataSource: YieldDataSource | null = null;

function getDataSource(): YieldDataSource {
  if (!cachedDataSource) cachedDataSource = createSupabaseDataSource();
  return cachedDataSource;
}

function normalizeQuery(query: VercelRequest['query']): RouteQuery {
  const normalized: RouteQuery = {};
  for (const [key, value] of Object.entries(query)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }
  return normalized;
}

/**
 * `x-vercel-forwarded-for` is set by the platform and cannot be spoofed by the
 * client, unlike `x-forwarded-for`, which is only a fallback for local runs.
 */
function clientKey(req: VercelRequest): string {
  const header = (name: string): string | undefined => {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwarded = header('x-vercel-forwarded-for') ?? header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return header('x-real-ip') ?? req.socket?.remoteAddress ?? 'unknown';
}

function failureResult(error: unknown, limitHeaders: Record<string, string>): ApiResult {
  if (error instanceof ConfigurationError) {
    return errorResult(
      500,
      'CONFIGURATION_ERROR',
      'The API is not configured correctly. This is a deployment problem, not a problem with your request.',
      {},
      limitHeaders
    );
  }

  if (error instanceof UpstreamError) {
    return errorResult(
      502,
      'UPSTREAM_ERROR',
      'The yield database rejected the request or was unreachable.',
      { upstream_status: error.status },
      limitHeaders
    );
  }

  return errorResult(
    500,
    'INTERNAL_ERROR',
    'Unable to serve yield data right now. Please retry shortly.',
    {},
    limitHeaders
  );
}

function send(res: VercelResponse, result: ApiResult): void {
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, value);
  }

  if (result.body === null) {
    res.status(result.status).end();
    return;
  }

  res.status(result.status).send(JSON.stringify(result.body));
}

export function createApiRoute(handler: RouteHandler) {
  return async function route(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      send(res, preflightResult());
      return;
    }

    if (!req.method || !ALLOWED_METHODS.includes(req.method)) {
      send(
        res,
        errorResult(
          405,
          'METHOD_NOT_ALLOWED',
          'This API is read-only. Only GET is supported.',
          {},
          { Allow: 'GET, HEAD, OPTIONS' }
        )
      );
      return;
    }

    const limit = sharedRateLimiter.check(clientKey(req));
    const limitHeaders = rateLimitHeaders(limit);

    if (!limit.allowed) {
      send(
        res,
        errorResult(
          429,
          'RATE_LIMIT_EXCEEDED',
          `Rate limit of ${limit.limit} requests per minute exceeded. Retry in ${limit.retryAfterSeconds}s.`,
          { retry_after_seconds: limit.retryAfterSeconds },
          { ...limitHeaders, 'Retry-After': String(limit.retryAfterSeconds) }
        )
      );
      return;
    }

    try {
      // Lazy getter: endpoints that serve only static data never touch the database.
      const ctx: HandlerContext = {
        get dataSource() {
          return getDataSource();
        },
      };
      const result = await handler(normalizeQuery(req.query), ctx);
      send(res, { ...result, headers: { ...result.headers, ...limitHeaders } });
    } catch (error) {
      // Full detail goes to the logs; the response names the failure class so a
      // deployment problem is distinguishable from a database one without
      // echoing internals back to callers.
      console.error('[api] request failed', req.url, error);
      send(res, failureResult(error, limitHeaders));
    }
  };
}
