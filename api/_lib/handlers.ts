/**
 * Endpoint logic for the public yield API.
 *
 * Each handler takes parsed input plus a data source and returns an ApiResult.
 * Nothing here touches the serverless runtime, so every endpoint is testable
 * against an in-memory data source.
 */

import {
  API_VERSION,
  buildAllRecords,
  buildCurrentDataset,
  filterRecords,
  findRecordById,
  InvalidParameterError,
  parseHistoryRange,
  parseYieldQuery,
  sortRecords,
  SOURCE_NAME,
  toHistoryPoints,
} from '../../src/lib/yields/service';
import {
  getTrackedAssets,
  OPPORTUNITIES_BY_ID,
  YIELD_OPPORTUNITIES,
} from '../../src/lib/yields/registry';
import { SNAPSHOT_RETENTION_DAYS, type YieldDataSource } from './datasource';
import {
  buildMeta,
  CACHE_POLICY,
  collectionResult,
  errorResult,
  jsonResult,
  singleResult,
  type ApiResult,
} from './http';
import { DEFAULT_RATE_LIMIT } from './ratelimit';

export interface HandlerContext {
  dataSource: YieldDataSource;
  now?: () => Date;
}

const currentTime = (ctx: HandlerContext): Date => (ctx.now ? ctx.now() : new Date());

function invalidParameter(error: InvalidParameterError): ApiResult {
  return errorResult(400, 'INVALID_PARAMETER', error.message, { parameter: error.parameter });
}

function notFound(id: string): ApiResult {
  return errorResult(404, 'NOT_FOUND', 'Yield opportunity not found', { id });
}

export async function handleYieldsList(
  query: Record<string, string | undefined>,
  ctx: HandlerContext
): Promise<ApiResult> {
  let parsed;
  try {
    parsed = parseYieldQuery(query);
  } catch (error) {
    if (error instanceof InvalidParameterError) return invalidParameter(error);
    throw error;
  }

  const rows = await ctx.dataSource.getRecentSnapshots();
  const dataset = buildCurrentDataset(rows, currentTime(ctx));

  const matching = sortRecords(filterRecords(buildAllRecords(dataset), parsed));
  const page = matching.slice(parsed.offset, parsed.offset + parsed.limit);

  return collectionResult(
    page,
    { limit: parsed.limit, offset: parsed.offset, total: matching.length },
    buildMeta(dataset.asOf, {
      last_updated_at: dataset.lastUpdate,
      total_tracked: YIELD_OPPORTUNITIES.length,
    })
  );
}

export async function handleYieldById(id: string, ctx: HandlerContext): Promise<ApiResult> {
  if (!OPPORTUNITIES_BY_ID[id]) return notFound(id);

  const rows = await ctx.dataSource.getRecentSnapshots();
  const dataset = buildCurrentDataset(rows, currentTime(ctx));
  const record = findRecordById(id, dataset);

  if (!record) return notFound(id);

  return singleResult(record, buildMeta(dataset.asOf, { last_updated_at: dataset.lastUpdate }));
}

export async function handleYieldHistory(
  id: string,
  query: Record<string, string | undefined>,
  ctx: HandlerContext
): Promise<ApiResult> {
  const meta = OPPORTUNITIES_BY_ID[id];
  if (!meta) return notFound(id);

  const now = currentTime(ctx);

  let range;
  try {
    range = parseHistoryRange(query, now);
  } catch (error) {
    if (error instanceof InvalidParameterError) return invalidParameter(error);
    throw error;
  }

  const rows = await ctx.dataSource.getPoolHistory(meta.poolKey, range.from, range.to);
  const points = toHistoryPoints(rows);
  const latest = points.length > 0 ? points[points.length - 1].timestamp : null;

  return jsonResult(
    {
      data: points,
      meta: buildMeta(latest ?? now.toISOString(), {
        id: meta.id,
        from: range.from,
        to: range.to,
        points: points.length,
        retention_days: SNAPSHOT_RETENTION_DAYS,
      }),
    },
    CACHE_POLICY.history
  );
}

export async function handleAssets(ctx: HandlerContext): Promise<ApiResult> {
  const assets = getTrackedAssets().map((asset) => ({
    symbol: asset.symbol,
    asset_symbol: asset.symbol,
    name: asset.name,
    chains: asset.chains,
    opportunity_count: asset.opportunityCount,
  }));

  return collectionResult(
    assets,
    { limit: assets.length, offset: 0, total: assets.length },
    buildMeta(currentTime(ctx).toISOString()),
    CACHE_POLICY.static
  );
}

export async function handleStatus(ctx: HandlerContext): Promise<ApiResult> {
  const now = currentTime(ctx);
  const rows = await ctx.dataSource.getRecentSnapshots();
  const dataset = buildCurrentDataset(rows, now);

  return singleResult(
    {
      source: SOURCE_NAME,
      api_version: API_VERSION,
      status: 'ok',
      data_timestamp: dataset.asOf,
      last_successful_update: dataset.lastUpdate,
      previous_update: dataset.previousSnapshotAt,
      tracked_opportunities: YIELD_OPPORTUNITIES.length,
      pools_with_live_snapshots: Object.keys(dataset.stats).length,
      snapshot_retention_days: SNAPSHOT_RETENTION_DAYS,
      rate_limit_per_minute: DEFAULT_RATE_LIMIT,
    },
    buildMeta(dataset.asOf),
    CACHE_POLICY.status
  );
}
