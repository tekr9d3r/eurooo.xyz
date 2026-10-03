/**
 * Pure transformation layer for the public yield API.
 *
 * Takes raw `protocol_snapshots` rows and the static registry, and produces the
 * normalized public records. No framework, no I/O — everything here is a pure
 * function so the API handlers stay thin and the behaviour is directly testable.
 */

import {
  OPPORTUNITIES_BY_ID,
  YIELD_OPPORTUNITIES,
  type YieldOpportunityMeta,
  type YieldStrategy,
} from './registry.js';

export const API_VERSION = 'v1';
export const SOURCE_NAME = 'Eurooo';
export const EUROOO_APP_URL = 'https://www.eurooo.xyz/app';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;
export const DEFAULT_HISTORY_DAYS = 30;
export const MAX_HISTORY_DAYS = 365;

/** Raw row as stored by the fetch-protocol-data edge function. */
export interface SnapshotRow {
  pool_key: string;
  apy: number;
  tvl: number;
  fetched_at: string;
}

/** Where a record's APY/TVL came from. */
export type DataOrigin = 'snapshot' | 'fallback';

export interface YieldOpportunityRecord {
  id: string;
  source: typeof SOURCE_NAME;
  protocol: string;
  name: string;
  description: string;
  asset: string;
  asset_symbol: string;
  chain: string;
  chain_id: number | null;
  strategy: YieldStrategy;
  apy: number;
  apy_7d: number | null;
  apy_30d: number | null;
  apy_change_pp: number | null;
  tvl_usd: number;
  tvl_change_pct: number | null;
  url: string;
  eurooo_url: string;
  contract_address: string | null;
  asset_address: string | null;
  audit_url: string | null;
  audit_provider: string | null;
  data_origin: DataOrigin;
  updated_at: string;
  previous_snapshot_at: string | null;
}

export interface HistoryPoint {
  timestamp: string;
  apy: number;
  tvl_usd: number;
}

interface PoolStats {
  apy: number;
  tvl: number;
  apy7d: number | null;
  apy30d: number | null;
  previousApy: number | null;
  previousTvl: number | null;
  updatedAt: string;
}

export interface CurrentDataset {
  /** Timestamp of the newest snapshot, or the build time when none exists. */
  asOf: string;
  /** Timestamp of the newest snapshot. Null when the table is empty. */
  lastUpdate: string | null;
  previousSnapshotAt: string | null;
  stats: Record<string, PoolStats>;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Collapses snapshot rows into per-pool current values, trailing APY averages
 * and deltas against the previous snapshot.
 *
 * Rows may be truncated by the database row cap, so they must be passed newest
 * first: that way truncation only shortens the averaging window and never
 * corrupts the current values.
 */
export function buildCurrentDataset(rows: SnapshotRow[], now: Date = new Date()): CurrentDataset {
  const timestamps = [...new Set(rows.map((r) => r.fetched_at))].sort().reverse();
  const lastUpdate = timestamps[0] ?? null;
  const previousSnapshotAt = timestamps[1] ?? null;

  const byPool = new Map<string, SnapshotRow[]>();
  for (const row of rows) {
    const list = byPool.get(row.pool_key);
    if (list) list.push(row);
    else byPool.set(row.pool_key, [row]);
  }

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const stats: Record<string, PoolStats> = {};

  for (const [poolKey, poolRows] of byPool) {
    const sorted = [...poolRows].sort((a, b) => b.fetched_at.localeCompare(a.fetched_at));
    const current = sorted[0];

    const apyWithin = (since: number) =>
      sorted.filter((r) => Date.parse(r.fetched_at) >= since).map((r) => r.apy);

    const window7d = apyWithin(sevenDaysAgo);
    const window30d = apyWithin(thirtyDaysAgo);

    const previous = previousSnapshotAt
      ? sorted.find((r) => r.fetched_at === previousSnapshotAt)
      : undefined;

    stats[poolKey] = {
      apy: current.apy,
      tvl: current.tvl,
      // A single data point is just the current value restated, not an average.
      apy7d: window7d.length > 1 ? round(mean(window7d), 2) : null,
      apy30d: window30d.length > 1 ? round(mean(window30d), 2) : null,
      previousApy: previous ? previous.apy : null,
      previousTvl: previous ? previous.tvl : null,
      updatedAt: current.fetched_at,
    };
  }

  return {
    asOf: lastUpdate ?? now.toISOString(),
    lastUpdate,
    previousSnapshotAt,
    stats,
  };
}

export function toOpportunityRecord(
  meta: YieldOpportunityMeta,
  dataset: CurrentDataset
): YieldOpportunityRecord {
  const snapshot = dataset.stats[meta.poolKey];

  const apy = snapshot ? snapshot.apy : meta.fallback.apy;
  const tvl = snapshot ? snapshot.tvl : meta.fallback.tvl;

  const apyChange =
    snapshot && snapshot.previousApy !== null ? round(apy - snapshot.previousApy, 2) : null;

  const tvlChange =
    snapshot && snapshot.previousTvl !== null && snapshot.previousTvl !== 0
      ? round(((tvl - snapshot.previousTvl) / snapshot.previousTvl) * 100, 2)
      : null;

  return {
    id: meta.id,
    source: SOURCE_NAME,
    protocol: meta.protocol,
    name: meta.name,
    description: meta.description,
    asset: meta.asset,
    asset_symbol: meta.asset,
    chain: meta.chain,
    chain_id: meta.chainId,
    strategy: meta.strategy,
    apy: round(apy, 2),
    apy_7d: snapshot ? snapshot.apy7d : null,
    apy_30d: snapshot ? snapshot.apy30d : null,
    apy_change_pp: apyChange,
    tvl_usd: Math.round(tvl),
    tvl_change_pct: tvlChange,
    url: meta.url,
    eurooo_url: EUROOO_APP_URL,
    contract_address: meta.contractAddress ?? null,
    asset_address: meta.assetAddress ?? null,
    audit_url: meta.auditUrl ?? null,
    audit_provider: meta.auditProvider ?? null,
    data_origin: snapshot ? 'snapshot' : 'fallback',
    updated_at: snapshot ? snapshot.updatedAt : dataset.asOf,
    previous_snapshot_at: snapshot && snapshot.previousApy !== null ? dataset.previousSnapshotAt : null,
  };
}

export function buildAllRecords(dataset: CurrentDataset): YieldOpportunityRecord[] {
  return YIELD_OPPORTUNITIES.map((meta) => toOpportunityRecord(meta, dataset));
}

export function findRecordById(id: string, dataset: CurrentDataset): YieldOpportunityRecord | null {
  const meta = OPPORTUNITIES_BY_ID[id];
  return meta ? toOpportunityRecord(meta, dataset) : null;
}

export interface YieldFilters {
  asset?: string;
  chain?: string;
  protocol?: string;
  strategy?: string;
  minApy?: number;
  maxApy?: number;
  minTvlUsd?: number;
}

export interface YieldQuery extends YieldFilters {
  limit: number;
  offset: number;
}

export class InvalidParameterError extends Error {
  readonly parameter: string;

  constructor(parameter: string, message: string) {
    super(message);
    this.name = 'InvalidParameterError';
    this.parameter = parameter;
  }
}

function parseNumberParam(name: string, raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new InvalidParameterError(name, `'${name}' must be a number.`);
  }
  return value;
}

function parseIntegerParam(name: string, raw: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidParameterError(
      name,
      `'${name}' must be an integer between ${min} and ${max}.`
    );
  }
  return value;
}

/** Reads a query param, treating empty strings as absent. */
function param(query: Record<string, string | undefined>, name: string): string | undefined {
  const value = query[name];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function parseYieldQuery(query: Record<string, string | undefined>): YieldQuery {
  const limitRaw = param(query, 'limit');
  const offsetRaw = param(query, 'offset');
  const minApyRaw = param(query, 'min_apy');
  const maxApyRaw = param(query, 'max_apy');
  const minTvlRaw = param(query, 'min_tvl_usd');
  const strategy = param(query, 'strategy');

  if (strategy && strategy !== 'lending' && strategy !== 'vault') {
    throw new InvalidParameterError('strategy', "'strategy' must be one of: lending, vault.");
  }

  const parsed: YieldQuery = {
    asset: param(query, 'asset'),
    chain: param(query, 'chain'),
    protocol: param(query, 'protocol'),
    strategy,
    minApy: minApyRaw === undefined ? undefined : parseNumberParam('min_apy', minApyRaw),
    maxApy: maxApyRaw === undefined ? undefined : parseNumberParam('max_apy', maxApyRaw),
    minTvlUsd: minTvlRaw === undefined ? undefined : parseNumberParam('min_tvl_usd', minTvlRaw),
    limit: limitRaw === undefined ? DEFAULT_LIMIT : parseIntegerParam('limit', limitRaw, 1, MAX_LIMIT),
    offset: offsetRaw === undefined ? 0 : parseIntegerParam('offset', offsetRaw, 0, Number.MAX_SAFE_INTEGER),
  };

  if (parsed.minApy !== undefined && parsed.maxApy !== undefined && parsed.minApy > parsed.maxApy) {
    throw new InvalidParameterError('min_apy', "'min_apy' must not exceed 'max_apy'.");
  }

  return parsed;
}

const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function filterRecords(
  records: YieldOpportunityRecord[],
  filters: YieldFilters
): YieldOpportunityRecord[] {
  return records.filter((r) => {
    if (filters.asset && !sameText(r.asset, filters.asset)) return false;
    if (filters.chain && !sameText(r.chain, filters.chain)) return false;
    if (filters.protocol && !sameText(r.protocol, filters.protocol)) return false;
    if (filters.strategy && r.strategy !== filters.strategy) return false;
    if (filters.minApy !== undefined && r.apy < filters.minApy) return false;
    if (filters.maxApy !== undefined && r.apy > filters.maxApy) return false;
    if (filters.minTvlUsd !== undefined && r.tvl_usd < filters.minTvlUsd) return false;
    return true;
  });
}

/** Highest APY first, with id as a tiebreaker so pagination is stable. */
export function sortRecords(records: YieldOpportunityRecord[]): YieldOpportunityRecord[] {
  return [...records].sort((a, b) => b.apy - a.apy || a.id.localeCompare(b.id));
}

export interface HistoryRange {
  from: string;
  to: string;
  days: number | null;
}

export function parseHistoryRange(
  query: Record<string, string | undefined>,
  now: Date = new Date()
): HistoryRange {
  const fromRaw = param(query, 'from');
  const toRaw = param(query, 'to');
  const daysRaw = param(query, 'days');

  const parseTimestamp = (name: string, raw: string): Date => {
    const parsedValue = new Date(raw);
    if (Number.isNaN(parsedValue.getTime())) {
      throw new InvalidParameterError(name, `'${name}' must be an ISO 8601 timestamp.`);
    }
    return parsedValue;
  };

  if (fromRaw || toRaw) {
    const to = toRaw ? parseTimestamp('to', toRaw) : now;
    const from = fromRaw
      ? parseTimestamp('from', fromRaw)
      : new Date(to.getTime() - DEFAULT_HISTORY_DAYS * 24 * 60 * 60 * 1000);

    if (from.getTime() > to.getTime()) {
      throw new InvalidParameterError('from', "'from' must be earlier than 'to'.");
    }
    return { from: from.toISOString(), to: to.toISOString(), days: null };
  }

  const days =
    daysRaw === undefined
      ? DEFAULT_HISTORY_DAYS
      : parseIntegerParam('days', daysRaw, 1, MAX_HISTORY_DAYS);

  return {
    from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
    days,
  };
}

/** Oldest first, which is the natural order for charting and trend analysis. */
export function toHistoryPoints(rows: SnapshotRow[]): HistoryPoint[] {
  return [...rows]
    .sort((a, b) => a.fetched_at.localeCompare(b.fetched_at))
    .map((r) => ({
      timestamp: new Date(r.fetched_at).toISOString(),
      apy: round(r.apy, 2),
      tvl_usd: Math.round(r.tvl),
    }));
}
