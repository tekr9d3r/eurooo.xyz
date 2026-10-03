import { describe, it, expect } from 'vitest';

import {
  handleAssets,
  handleStatus,
  handleYieldById,
  handleYieldHistory,
  handleYieldsList,
  type HandlerContext,
} from '../handlers.js';
import type { YieldDataSource } from '../datasource.js';
import { YIELD_OPPORTUNITIES } from '../../../src/lib/yields/registry.js';
import type { SnapshotRow } from '../../../src/lib/yields/service.js';

const NOW = new Date('2026-10-03T12:00:00.000Z');
const T0 = '2026-10-03T11:00:00.000Z'; // newest
const T1 = '2026-10-03T10:00:00.000Z'; // previous
const T2 = '2026-09-28T10:00:00.000Z'; // within 7d and 30d

const ROWS: SnapshotRow[] = [
  { pool_key: 'aaveBase', apy: 4.82, tvl: 12_500_000, fetched_at: T0 },
  { pool_key: 'aaveBase', apy: 5.0, tvl: 12_000_000, fetched_at: T1 },
  { pool_key: 'aaveBase', apy: 4.5, tvl: 11_000_000, fetched_at: T2 },
  { pool_key: 'aaveEthereum', apy: 2.0, tvl: 70_000_000, fetched_at: T0 },
  { pool_key: 'aaveEthereum', apy: 2.0, tvl: 70_000_000, fetched_at: T1 },
  { pool_key: 'morphoGauntlet', apy: 9.5, tvl: 5_000_000, fetched_at: T0 },
  { pool_key: 'fluidBase', apy: 1.0, tvl: 900_000, fetched_at: T0 },
];

function makeContext(rows: SnapshotRow[] = ROWS): HandlerContext {
  const dataSource: YieldDataSource = {
    async getRecentSnapshots() {
      return [...rows].sort((a, b) => b.fetched_at.localeCompare(a.fetched_at));
    },
    async getPoolHistory(poolKey, from, to) {
      return rows.filter(
        (r) => r.pool_key === poolKey && r.fetched_at >= from && r.fetched_at <= to
      );
    },
  };

  return { dataSource, now: () => NOW };
}

type Envelope = {
  data: Record<string, unknown>[];
  pagination: { limit: number; offset: number; total: number };
  meta: Record<string, unknown>;
};

const asEnvelope = (body: unknown) => body as Envelope;
const asSingle = (body: unknown) => body as { data: Record<string, unknown>; meta: Record<string, unknown> };
const asError = (body: unknown) => body as { error: { code: string; message: string; parameter?: string } };

describe('GET /api/v1/yields', () => {
  it('returns every tracked opportunity with the standard envelope', async () => {
    const result = await handleYieldsList({}, makeContext());
    const body = asEnvelope(result.body);

    expect(result.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['data', 'meta', 'pagination']);
    expect(body.pagination.total).toBe(YIELD_OPPORTUNITIES.length);
    expect(body.meta.source).toBe('Eurooo');
    expect(body.meta.api_version).toBe('v1');
    // as_of reflects the newest snapshot, not the time of the request.
    expect(body.meta.as_of).toBe(T0);
  });

  it('sorts by APY descending so the best yield comes first', async () => {
    const result = await handleYieldsList({}, makeContext());
    const apys = asEnvelope(result.body).data.map((r) => r.apy as number);

    expect(apys).toEqual([...apys].sort((a, b) => b - a));
    expect(asEnvelope(result.body).data[0].id).toBe('morpho-gauntlet');
  });

  it('serves live snapshot values and derived change fields', async () => {
    const result = await handleYieldsList({ protocol: 'Aave', chain: 'Base' }, makeContext());
    const [record] = asEnvelope(result.body).data;

    expect(record.apy).toBe(4.82);
    expect(record.tvl_usd).toBe(12_500_000);
    expect(record.data_origin).toBe('snapshot');
    expect(record.updated_at).toBe(T0);
    // 4.82 - 5.00 against the previous snapshot.
    expect(record.apy_change_pp).toBe(-0.18);
    // (12.5M - 12.0M) / 12.0M.
    expect(record.tvl_change_pct).toBe(4.17);
    // Mean of 4.82, 5.00 and 4.50.
    expect(record.apy_7d).toBe(4.77);
    expect(record.apy_30d).toBe(4.77);
  });

  it('falls back to Eurooo-maintained values for pools with no snapshot', async () => {
    const result = await handleYieldsList({ protocol: 'Jupiter' }, makeContext());
    const [record] = asEnvelope(result.body).data;

    const registryEntry = YIELD_OPPORTUNITIES.find((o) => o.id === 'jupiter')!;
    expect(record.data_origin).toBe('fallback');
    expect(record.apy).toBe(registryEntry.fallback.apy);
    expect(record.tvl_usd).toBe(registryEntry.fallback.tvl);
    expect(record.apy_7d).toBeNull();
    expect(record.apy_change_pp).toBeNull();
  });

  it('filters by asset, case-insensitively', async () => {
    const result = await handleYieldsList({ asset: 'eurcv' }, makeContext());
    const assets = asEnvelope(result.body).data.map((r) => r.asset);

    expect(assets.length).toBeGreaterThan(0);
    expect(new Set(assets)).toEqual(new Set(['EURCV']));
  });

  it('filters by chain', async () => {
    const result = await handleYieldsList({ chain: 'Base' }, makeContext());
    const chains = asEnvelope(result.body).data.map((r) => r.chain);

    expect(chains.length).toBeGreaterThan(0);
    expect(new Set(chains)).toEqual(new Set(['Base']));
  });

  it('filters by protocol', async () => {
    const result = await handleYieldsList({ protocol: 'morpho' }, makeContext());
    const body = asEnvelope(result.body);

    expect(body.data.length).toBe(8);
    expect(new Set(body.data.map((r) => r.protocol))).toEqual(new Set(['Morpho']));
  });

  it('filters by strategy', async () => {
    const result = await handleYieldsList({ strategy: 'lending' }, makeContext());
    const strategies = asEnvelope(result.body).data.map((r) => r.strategy);

    expect(strategies.length).toBeGreaterThan(0);
    expect(new Set(strategies)).toEqual(new Set(['lending']));
  });

  it('filters by APY and TVL bounds', async () => {
    const context = makeContext();

    const minApy = await handleYieldsList({ min_apy: '4' }, context);
    for (const record of asEnvelope(minApy.body).data) {
      expect(record.apy as number).toBeGreaterThanOrEqual(4);
    }

    const maxApy = await handleYieldsList({ max_apy: '1' }, context);
    for (const record of asEnvelope(maxApy.body).data) {
      expect(record.apy as number).toBeLessThanOrEqual(1);
    }

    const minTvl = await handleYieldsList({ min_tvl_usd: '10000000' }, context);
    for (const record of asEnvelope(minTvl.body).data) {
      expect(record.tvl_usd as number).toBeGreaterThanOrEqual(10_000_000);
    }
  });

  it('combines filters', async () => {
    const result = await handleYieldsList(
      { asset: 'EURC', chain: 'Base', strategy: 'lending' },
      makeContext()
    );

    for (const record of asEnvelope(result.body).data) {
      expect(record.asset).toBe('EURC');
      expect(record.chain).toBe('Base');
      expect(record.strategy).toBe('lending');
    }
  });

  it('paginates without overlap and reports the unpaginated total', async () => {
    const context = makeContext();
    const first = await handleYieldsList({ limit: '5', offset: '0' }, context);
    const second = await handleYieldsList({ limit: '5', offset: '5' }, context);

    const firstBody = asEnvelope(first.body);
    const secondBody = asEnvelope(second.body);

    expect(firstBody.data).toHaveLength(5);
    expect(secondBody.data).toHaveLength(5);
    expect(firstBody.pagination).toEqual({
      limit: 5,
      offset: 0,
      total: YIELD_OPPORTUNITIES.length,
    });
    expect(secondBody.pagination.offset).toBe(5);

    const firstIds = firstBody.data.map((r) => r.id);
    const secondIds = secondBody.data.map((r) => r.id);
    expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
  });

  it('defaults to a limit of 50 and returns an empty page past the end', async () => {
    const context = makeContext();

    const defaulted = await handleYieldsList({}, context);
    expect(asEnvelope(defaulted.body).pagination.limit).toBe(50);

    const past = await handleYieldsList({ offset: '9999' }, context);
    expect(asEnvelope(past.body).data).toEqual([]);
    expect(asEnvelope(past.body).pagination.total).toBe(YIELD_OPPORTUNITIES.length);
  });

  it('returns an empty data array rather than an error when nothing matches', async () => {
    const result = await handleYieldsList({ protocol: 'NotAProtocol' }, makeContext());

    expect(result.status).toBe(200);
    expect(asEnvelope(result.body).data).toEqual([]);
    expect(asEnvelope(result.body).pagination.total).toBe(0);
  });

  it('serves every documented field on every record, with null for unknown values', async () => {
    const expectedKeys = [
      'apy',
      'apy_30d',
      'apy_7d',
      'apy_change_pp',
      'asset',
      'asset_address',
      'asset_symbol',
      'audit_provider',
      'audit_url',
      'chain',
      'chain_id',
      'contract_address',
      'data_origin',
      'description',
      'eurooo_url',
      'id',
      'name',
      'previous_snapshot_at',
      'protocol',
      'source',
      'strategy',
      'tvl_change_pct',
      'tvl_usd',
      'updated_at',
      'url',
    ];

    const result = await handleYieldsList({ limit: '200' }, makeContext());
    const records = asEnvelope(result.body).data;

    expect(records).toHaveLength(YIELD_OPPORTUNITIES.length);
    for (const record of records) {
      expect(Object.keys(record).sort()).toEqual(expectedKeys);
      expect(record.source).toBe('Eurooo');
      expect(typeof record.apy).toBe('number');
      expect(typeof record.tvl_usd).toBe('number');
      expect(Number.isInteger(record.tvl_usd)).toBe(true);
      expect(typeof record.id).toBe('string');
      expect(record.updated_at as string).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    }
  });
});

describe('GET /api/v1/yields invalid parameters', () => {
  const cases: Array<[string, Record<string, string>, string]> = [
    ['limit above the maximum', { limit: '500' }, 'limit'],
    ['limit of zero', { limit: '0' }, 'limit'],
    ['non-numeric limit', { limit: 'abc' }, 'limit'],
    ['fractional limit', { limit: '1.5' }, 'limit'],
    ['negative offset', { offset: '-1' }, 'offset'],
    ['non-numeric min_apy', { min_apy: 'high' }, 'min_apy'],
    ['non-numeric min_tvl_usd', { min_tvl_usd: '1M' }, 'min_tvl_usd'],
    ['unknown strategy', { strategy: 'staking' }, 'strategy'],
    ['min_apy above max_apy', { min_apy: '5', max_apy: '1' }, 'min_apy'],
  ];

  for (const [label, query, parameter] of cases) {
    it(`rejects ${label} with 400`, async () => {
      const result = await handleYieldsList(query, makeContext());
      const body = asError(result.body);

      expect(result.status).toBe(400);
      expect(body.error.code).toBe('INVALID_PARAMETER');
      expect(body.error.parameter).toBe(parameter);
      expect(typeof body.error.message).toBe('string');
    });
  }

  it('treats blank parameters as absent', async () => {
    const result = await handleYieldsList({ asset: '', chain: '  ' }, makeContext());

    expect(result.status).toBe(200);
    expect(asEnvelope(result.body).pagination.total).toBe(YIELD_OPPORTUNITIES.length);
  });
});

describe('GET /api/v1/yields/{id}', () => {
  it('returns the full record in a single-record envelope', async () => {
    const result = await handleYieldById('aave-base', makeContext());
    const body = asSingle(result.body);

    expect(result.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['data', 'meta']);
    expect(body.data.id).toBe('aave-base');
    expect(body.data.apy).toBe(4.82);
    expect(body.meta.source).toBe('Eurooo');
  });

  it('matches the record served by the collection endpoint', async () => {
    const context = makeContext();
    const single = asSingle((await handleYieldById('fluid', context)).body).data;
    const fromList = asEnvelope(
      (await handleYieldsList({ limit: '200' }, context)).body
    ).data.find((r) => r.id === 'fluid');

    expect(single).toEqual(fromList);
  });

  it('returns 404 for an unknown id', async () => {
    const result = await handleYieldById('does-not-exist', makeContext());
    const body = asError(result.body);

    expect(result.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Yield opportunity not found');
    expect(result.headers['Cache-Control']).toBe('no-store');
  });

  it('returns 404 for an empty id', async () => {
    const result = await handleYieldById('', makeContext());
    expect(result.status).toBe(404);
  });

  it('resolves every registry id', async () => {
    const context = makeContext();
    for (const opportunity of YIELD_OPPORTUNITIES) {
      const result = await handleYieldById(opportunity.id, context);
      expect(result.status, `id ${opportunity.id} should resolve`).toBe(200);
    }
  });
});

describe('GET /api/v1/yields/{id}/history', () => {
  it('returns points oldest first with numeric values', async () => {
    const result = await handleYieldHistory('aave-base', {}, makeContext());
    const body = result.body as { data: Array<Record<string, unknown>>; meta: Record<string, unknown> };

    expect(result.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(['data', 'meta']);
    expect(body.data.map((p) => p.timestamp)).toEqual([T2, T1, T0]);
    expect(body.data[0]).toEqual({ timestamp: T2, apy: 4.5, tvl_usd: 11_000_000 });
    expect(body.meta.id).toBe('aave-base');
    expect(body.meta.points).toBe(3);
    expect(body.meta.source).toBe('Eurooo');
  });

  it('narrows the range with days', async () => {
    const result = await handleYieldHistory('aave-base', { days: '1' }, makeContext());
    const body = result.body as { data: unknown[]; meta: Record<string, unknown> };

    // Only T0 and T1 fall inside the last 24 hours; T2 is five days older.
    expect(body.data).toHaveLength(2);
    expect(body.meta.from).toBe('2026-10-02T12:00:00.000Z');
    expect(body.meta.to).toBe(NOW.toISOString());
  });

  it('honours explicit from and to timestamps', async () => {
    const result = await handleYieldHistory(
      'aave-base',
      { from: '2026-10-03T10:30:00.000Z', to: '2026-10-03T11:30:00.000Z' },
      makeContext()
    );
    const body = result.body as { data: Array<Record<string, unknown>> };

    expect(body.data).toHaveLength(1);
    expect(body.data[0].timestamp).toBe(T0);
  });

  it('returns an empty series for opportunities with no stored history', async () => {
    const result = await handleYieldHistory('jupiter', {}, makeContext());
    const body = result.body as { data: unknown[]; meta: Record<string, unknown> };

    expect(result.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.meta.points).toBe(0);
    expect(body.meta.retention_days).toBe(30);
  });

  it('returns 404 for an unknown id', async () => {
    const result = await handleYieldHistory('nope', {}, makeContext());

    expect(result.status).toBe(404);
    expect(asError(result.body).error.code).toBe('NOT_FOUND');
  });

  it('rejects invalid range parameters', async () => {
    const context = makeContext();

    const tooManyDays = await handleYieldHistory('aave-base', { days: '400' }, context);
    expect(tooManyDays.status).toBe(400);
    expect(asError(tooManyDays.body).error.parameter).toBe('days');

    const badTimestamp = await handleYieldHistory('aave-base', { from: 'yesterday' }, context);
    expect(badTimestamp.status).toBe(400);
    expect(asError(badTimestamp.body).error.parameter).toBe('from');

    const reversed = await handleYieldHistory(
      'aave-base',
      { from: '2026-10-03T00:00:00Z', to: '2026-10-01T00:00:00Z' },
      context
    );
    expect(reversed.status).toBe(400);
    expect(asError(reversed.body).error.parameter).toBe('from');
  });
});

describe('GET /api/v1/assets', () => {
  it('lists the tracked EUR stablecoins', async () => {
    const result = await handleAssets(makeContext());
    const body = asEnvelope(result.body);

    expect(result.status).toBe(200);
    expect(body.data.map((a) => a.symbol)).toEqual(['EURC', 'EURCV', 'EURe']);

    for (const asset of body.data) {
      expect(Object.keys(asset).sort()).toEqual([
        'asset_symbol',
        'chains',
        'name',
        'opportunity_count',
        'symbol',
      ]);
      expect(Array.isArray(asset.chains)).toBe(true);
      expect(typeof asset.opportunity_count).toBe('number');
    }
  });

  it('counts every opportunity exactly once across assets', async () => {
    const result = await handleAssets(makeContext());
    const total = asEnvelope(result.body).data.reduce(
      (sum, asset) => sum + (asset.opportunity_count as number),
      0
    );

    expect(total).toBe(YIELD_OPPORTUNITIES.length);
  });
});

describe('GET /api/v1/status', () => {
  it('reports version, freshness and tracked count', async () => {
    const result = await handleStatus(makeContext());
    const body = asSingle(result.body);

    expect(result.status).toBe(200);
    expect(body.data).toMatchObject({
      source: 'Eurooo',
      api_version: 'v1',
      status: 'ok',
      data_timestamp: T0,
      last_successful_update: T0,
      previous_update: T1,
      tracked_opportunities: YIELD_OPPORTUNITIES.length,
      snapshot_retention_days: 30,
    });
    expect(body.data.pools_with_live_snapshots).toBe(4);
  });

  it('stays healthy with an empty snapshot table', async () => {
    const result = await handleStatus(makeContext([]));
    const body = asSingle(result.body);

    expect(result.status).toBe(200);
    expect(body.data.last_successful_update).toBeNull();
    expect(body.data.data_timestamp).toBe(NOW.toISOString());
    expect(body.data.pools_with_live_snapshots).toBe(0);
  });

  it('serves fallback values for every opportunity when no snapshots exist', async () => {
    const result = await handleYieldsList({ limit: '200' }, makeContext([]));
    const records = asEnvelope(result.body).data;

    expect(records).toHaveLength(YIELD_OPPORTUNITIES.length);
    for (const record of records) {
      expect(record.data_origin).toBe('fallback');
    }
  });
});
