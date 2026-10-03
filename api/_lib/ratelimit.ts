/**
 * Fixed-window rate limiter.
 *
 * State lives in the function instance's memory, so the effective ceiling is
 * per instance rather than global. That is deliberate: it needs no extra
 * infrastructure and is sufficient to stop a single client hammering one
 * instance. Vercel's platform firewall remains the defence against distributed
 * abuse.
 */

export const DEFAULT_RATE_LIMIT = 120;
export const DEFAULT_WINDOW_MS = 60_000;

/** Above this many tracked clients, expired buckets are swept. */
const SWEEP_THRESHOLD = 5_000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix epoch milliseconds when the current window ends. */
  resetAt: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string, now?: number): RateLimitResult;
  reset(): void;
}

interface Bucket {
  count: number;
  windowStart: number;
}

export function createRateLimiter(
  limit: number = DEFAULT_RATE_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      if (buckets.size > SWEEP_THRESHOLD) {
        for (const [bucketKey, bucket] of buckets) {
          if (now - bucket.windowStart >= windowMs) buckets.delete(bucketKey);
        }
      }

      const existing = buckets.get(key);
      const bucket =
        existing && now - existing.windowStart < windowMs
          ? existing
          : { count: 0, windowStart: now };

      bucket.count += 1;
      buckets.set(key, bucket);

      const resetAt = bucket.windowStart + windowMs;
      const allowed = bucket.count <= limit;

      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    },

    reset() {
      buckets.clear();
    },
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

/** Shared across all endpoints so the quota is per client, not per route. */
export const sharedRateLimiter = createRateLimiter();
