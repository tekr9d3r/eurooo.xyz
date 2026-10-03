/**
 * Response primitives for the public API: envelopes, CORS, cache policy, errors.
 *
 * Handlers return a plain ApiResult so they stay independent of the serverless
 * runtime and can be asserted on directly in tests.
 */

import { API_VERSION, SOURCE_NAME } from '../../src/lib/yields/service';

export interface ApiResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export type ErrorCode =
  | 'INVALID_PARAMETER'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

/** Read-only, publicly consumable: any origin may GET. Writes are never routed. */
export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Api-Version': API_VERSION,
  'X-Data-Source': SOURCE_NAME,
  ...CORS_HEADERS,
};

/**
 * Cache windows per endpoint. Snapshots refresh far less often than these
 * windows, so edge caching costs no freshness; `as_of` always states the age of
 * the underlying data regardless of which cache served the response.
 */
export const CACHE_POLICY = {
  current: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  history: 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600',
  static: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  status: 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
  none: 'no-store',
} as const;

export interface ResponseMeta {
  source: typeof SOURCE_NAME;
  as_of: string;
  api_version: typeof API_VERSION;
  [key: string]: unknown;
}

export function buildMeta(asOf: string, extra: Record<string, unknown> = {}): ResponseMeta {
  return {
    source: SOURCE_NAME,
    as_of: asOf,
    api_version: API_VERSION,
    ...extra,
  };
}

export function jsonResult(
  body: unknown,
  cacheControl: string = CACHE_POLICY.current,
  extraHeaders: Record<string, string> = {}
): ApiResult {
  return {
    status: 200,
    headers: { ...BASE_HEADERS, 'Cache-Control': cacheControl, ...extraHeaders },
    body,
  };
}

export function collectionResult(
  data: unknown[],
  pagination: { limit: number; offset: number; total: number },
  meta: ResponseMeta,
  cacheControl: string = CACHE_POLICY.current
): ApiResult {
  return jsonResult({ data, pagination, meta }, cacheControl);
}

export function singleResult(
  data: unknown,
  meta: ResponseMeta,
  cacheControl: string = CACHE_POLICY.current
): ApiResult {
  return jsonResult({ data, meta }, cacheControl);
}

export function errorResult(
  status: number,
  code: ErrorCode,
  message: string,
  extra: Record<string, unknown> = {},
  extraHeaders: Record<string, string> = {}
): ApiResult {
  return {
    status,
    headers: {
      ...BASE_HEADERS,
      'Cache-Control': CACHE_POLICY.none,
      ...extraHeaders,
    },
    body: { error: { code, message, ...extra } },
  };
}

export function preflightResult(): ApiResult {
  return {
    status: 204,
    headers: { ...CORS_HEADERS, 'Cache-Control': CACHE_POLICY.static },
    body: null,
  };
}
