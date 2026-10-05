/**
 * Reads yield data from the same `protocol_snapshots` table the Eurooo frontend
 * renders from, so the API can never disagree with the app.
 *
 * Uses the publishable (anon) key only. That table's RLS policy grants public
 * SELECT and nothing else, so no privileged credential is involved and no write
 * path exists.
 */

import type { SnapshotRow } from '../../src/lib/yields/service.js';

/** The edge function prunes snapshots older than this. */
export const SNAPSHOT_RETENTION_DAYS = 30;

/** Window loaded for current values plus the 7d/30d trailing averages. */
const CURRENT_WINDOW_DAYS = 30;

/**
 * Upper bound on rows per query. Rows come back newest-first, so hitting this
 * cap only shortens the averaging window — current values stay correct.
 */
const MAX_ROWS = 20_000;

/** Reuse window for the snapshot read within a single warm instance. */
const MEMO_TTL_MS = 30_000;

/** The function's database configuration is absent or unusable. */
export class ConfigurationError extends Error {
  readonly variables: string[];

  constructor(reason: string, variables: string[]) {
    super(`Supabase configuration problem: ${reason}`);
    this.name = 'ConfigurationError';
    this.variables = variables;
  }
}

/** The database rejected the read or was unreachable. */
export class UpstreamError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(`Snapshot query failed with status ${status}: ${detail}`);
    this.name = 'UpstreamError';
    this.status = status;
  }
}

export interface YieldDataSource {
  /** Snapshots from the trailing 30 days, newest first. */
  getRecentSnapshots(): Promise<SnapshotRow[]>;
  /** Snapshots for one pool within an inclusive time range. */
  getPoolHistory(poolKey: string, from: string, to: string): Promise<SnapshotRow[]>;
}

interface SupabaseConfig {
  url: string;
  key: string;
}

export function readSupabaseConfig(env: NodeJS.ProcessEnv = process.env): SupabaseConfig {
  // Values pasted into a dashboard routinely pick up stray whitespace.
  const url = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').trim();
  const key = (
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    ''
  ).trim();

  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!key) missing.push('SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    throw new ConfigurationError(`not set: ${missing.join(', ')}`, missing);
  }

  // An unparseable URL or a key holding a newline makes fetch throw while
  // building the request, which is indistinguishable from a bug unless caught
  // here. Validating turns both into an actionable configuration error.
  let origin: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') throw new Error('not https');
    origin = parsed.origin;
  } catch {
    throw new ConfigurationError(
      'SUPABASE_URL must be a full https URL, for example https://<project-ref>.supabase.co',
      ['SUPABASE_URL']
    );
  }

  if (/[^\x21-\x7e]/.test(key)) {
    throw new ConfigurationError(
      'SUPABASE_PUBLISHABLE_KEY contains whitespace or non-printable characters and cannot be sent as a header',
      ['SUPABASE_PUBLISHABLE_KEY']
    );
  }

  return { url: origin, key };
}

const SELECT_COLUMNS = 'pool_key,apy,tvl,fetched_at';

async function querySnapshots(config: SupabaseConfig, search: string): Promise<SnapshotRow[]> {
  let response: Response;

  try {
    response = await fetch(`${config.url}/rest/v1/protocol_snapshots?${search}`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: 'application/json',
      },
    });
  } catch (cause) {
    // Never reached the database at all: DNS, TLS or a malformed request.
    throw new UpstreamError(0, `request could not be sent: ${(cause as Error).message}`);
  }

  if (!response.ok) {
    // Logged, never returned to the client: PostgREST explains exactly what it
    // rejected, which is what makes a misconfigured key or policy diagnosable.
    const detail = await response.text().catch(() => '<unreadable body>');
    throw new UpstreamError(response.status, detail.slice(0, 500));
  }

  const rows = (await response.json()) as Array<{
    pool_key: string;
    apy: number | string;
    tvl: number | string;
    fetched_at: string;
  }>;

  // Postgres NUMERIC is serialized as a string by PostgREST.
  return rows.map((row) => ({
    pool_key: row.pool_key,
    apy: Number(row.apy),
    tvl: Number(row.tvl),
    fetched_at: row.fetched_at,
  }));
}

export function createSupabaseDataSource(
  config: SupabaseConfig = readSupabaseConfig()
): YieldDataSource {
  let memo: { at: number; rows: Promise<SnapshotRow[]> } | null = null;

  return {
    getRecentSnapshots() {
      const now = Date.now();
      if (memo && now - memo.at < MEMO_TTL_MS) return memo.rows;

      const since = new Date(now - CURRENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const rows = querySnapshots(
        config,
        new URLSearchParams({
          select: SELECT_COLUMNS,
          fetched_at: `gte.${since}`,
          order: 'fetched_at.desc',
          limit: String(MAX_ROWS),
        }).toString()
      );

      memo = { at: now, rows };
      // A failed read must not be cached for the whole TTL.
      rows.catch(() => {
        if (memo?.rows === rows) memo = null;
      });

      return rows;
    },

    getPoolHistory(poolKey: string, from: string, to: string) {
      const search = new URLSearchParams({
        select: SELECT_COLUMNS,
        pool_key: `eq.${poolKey}`,
        order: 'fetched_at.desc',
        limit: String(MAX_ROWS),
      });
      // URLSearchParams cannot express repeated filters on one column.
      const query = `${search.toString()}&fetched_at=gte.${encodeURIComponent(
        from
      )}&fetched_at=lte.${encodeURIComponent(to)}`;

      return querySnapshots(config, query);
    },
  };
}
