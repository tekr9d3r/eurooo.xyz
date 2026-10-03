/**
 * Reads yield data from the same `protocol_snapshots` table the Eurooo frontend
 * renders from, so the API can never disagree with the app.
 *
 * Uses the publishable (anon) key only. That table's RLS policy grants public
 * SELECT and nothing else, so no privileged credential is involved and no write
 * path exists.
 */

import type { SnapshotRow } from '../../src/lib/yields/service';

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
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const key =
    env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase configuration missing: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return { url: url.replace(/\/$/, ''), key };
}

const SELECT_COLUMNS = 'pool_key,apy,tvl,fetched_at';

async function querySnapshots(config: SupabaseConfig, search: string): Promise<SnapshotRow[]> {
  const response = await fetch(`${config.url}/rest/v1/protocol_snapshots?${search}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Snapshot query failed with status ${response.status}`);
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
