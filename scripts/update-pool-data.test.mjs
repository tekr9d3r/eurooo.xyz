import { describe, it, expect } from 'vitest';

import {
  extractAaveReserve,
  extractDefiLlamaPools,
  extractJupiterEurc,
  matchPool,
  mergePools,
  MANUAL_POOLS,
} from './update-pool-data.mjs';

const llamaPool = (overrides = {}) => ({
  pool: 'some-id',
  project: 'aave-v3',
  chain: 'Base',
  symbol: 'EURC',
  tvlUsd: 1_000_000,
  apy: 1.5,
  apyBase: 1.2,
  apyReward: 0.3,
  ...overrides,
});

describe('matchPool', () => {
  it('matches on pool id alone, ignoring other attributes', () => {
    const pool = llamaPool({ pool: 'abc-123', project: 'anything', chain: 'Anywhere' });
    expect(matchPool(pool, { poolId: 'abc-123' })).toBe(true);
    expect(matchPool(pool, { poolId: 'different' })).toBe(false);
  });

  it('matches on project, chain and symbol together', () => {
    const matcher = { project: 'aave-v3', chain: 'Base', symbol: 'EURC' };

    expect(matchPool(llamaPool(), matcher)).toBe(true);
    expect(matchPool(llamaPool({ chain: 'Ethereum' }), matcher)).toBe(false);
    expect(matchPool(llamaPool({ project: 'morpho-v1' }), matcher)).toBe(false);
    expect(matchPool(llamaPool({ symbol: 'USDC' }), matcher)).toBe(false);
  });

  it('ignores case and accepts any of several symbols', () => {
    const matcher = { project: 'AAVE-V3', chain: 'base', symbol: ['EURE', 'EURe'] };
    expect(matchPool(llamaPool({ symbol: 'aGnoEURe' }), matcher)).toBe(true);
  });

  it('tolerates pools with missing fields rather than throwing', () => {
    const matcher = { project: 'aave-v3', chain: 'Base', symbol: 'EURC' };
    expect(matchPool({}, matcher)).toBe(false);
  });
});

describe('extractDefiLlamaPools', () => {
  // A rate of exactly 2 makes the conversion obvious in the expectations.
  const RATE = 2;

  it('pulls the tracked pools and reports the ones it could not find', () => {
    const { found, missing } = extractDefiLlamaPools(
      [
        llamaPool({ project: 'fluid-lending', chain: 'Base', symbol: 'EURC', apy: 4.826, tvlUsd: 12_500_000 }),
        llamaPool({ pool: 'd4ea65f3-b54b-49c4-81ba-56e16eec4fb7', apy: 2.30248, tvlUsd: 1_170_832 }),
      ],
      RATE
    );

    expect(found.fluidBase).toEqual({ apy: 4.83, tvl: 6_250_000 });
    expect(found.morphoGauntlet).toEqual({ apy: 2.3, tvl: 585_416 });
    // Everything else is absent from this fixture and must be reported, not invented.
    expect(missing).toContain('yoBase');
    expect(found.yoBase).toBeUndefined();
  });

  it('converts USD figures to EUR at the given rate', () => {
    const pools = [llamaPool({ project: 'fluid-lending', chain: 'Base', symbol: 'EURC', tvlUsd: 16_598_020 })];

    const { found } = extractDefiLlamaPools(pools, 1.118528274856635);
    expect(found.fluidBase.tvl).toBe(14_839_160);
  });

  it('no longer sources the Aave markets, which come from Aave directly', () => {
    const { missing } = extractDefiLlamaPools([], RATE);

    for (const key of ['aaveEthereum', 'aaveBase', 'aaveGnosis', 'aaveAvalanche']) {
      expect(missing).not.toContain(key);
    }
  });

  it('refuses to convert with a missing or nonsensical rate', () => {
    const pools = [llamaPool({ project: 'aave-v3', chain: 'Base', symbol: 'EURC' })];

    for (const bad of [undefined, 0, -1, NaN]) {
      expect(() => extractDefiLlamaPools(pools, bad)).toThrow(/bad EUR rate/i);
    }
  });

  it('prefers the base APY for pools configured that way', () => {
    const { found } = extractDefiLlamaPools(
      [llamaPool({ project: 'yo-protocol', chain: 'Base', symbol: 'EURC', apy: 9.9, apyBase: 2.26 })],
      RATE
    );

    expect(found.yoBase.apy).toBe(2.26);
  });

  it('falls back to the other APY field when the preferred one is null', () => {
    const { found } = extractDefiLlamaPools(
      [llamaPool({ project: 'yo-protocol', chain: 'Base', symbol: 'EURC', apy: 3.3, apyBase: null })],
      RATE
    );

    expect(found.yoBase.apy).toBe(3.3);
  });

  it('returns nothing rather than throwing on an empty pool list', () => {
    const { found, missing } = extractDefiLlamaPools([], RATE);
    expect(found).toEqual({});
    expect(missing.length).toBeGreaterThan(0);
  });
});

describe('extractAaveReserve', () => {
  // Shape and values taken from a live api.v3.aave.com response.
  const market = {
    reserves: [
      {
        underlyingToken: { symbol: 'USDC' },
        supplyInfo: { total: { value: '1000.0' }, apy: { formatted: '5.00' } },
      },
      {
        underlyingToken: { symbol: 'EURC' },
        supplyInfo: { total: { value: '40509441.954407' }, apy: { formatted: '2.23' } },
      },
    ],
  };

  it('reads total supplied in token units, not the net figure', () => {
    expect(extractAaveReserve(market, 'EURC')).toEqual({ apy: 2.23, tvl: 40_509_442 });
  });

  it('matches the symbol regardless of case, for EURe on Gnosis', () => {
    const gnosis = {
      reserves: [
        {
          underlyingToken: { symbol: 'EURe' },
          supplyInfo: { total: { value: '5000.5' }, apy: { formatted: '2.2' } },
        },
      ],
    };

    expect(extractAaveReserve(gnosis, 'EURE')).toEqual({ apy: 2.2, tvl: 5001 });
  });

  it('returns null rather than a wrong number when the reserve is absent', () => {
    expect(extractAaveReserve(market, 'EURe')).toBeNull();
    expect(extractAaveReserve({ reserves: [] }, 'EURC')).toBeNull();
    expect(extractAaveReserve(undefined, 'EURC')).toBeNull();
  });

  it('returns null when the figures are missing or unparseable', () => {
    const broken = {
      reserves: [{ underlyingToken: { symbol: 'EURC' }, supplyInfo: { total: {}, apy: {} } }],
    };

    expect(extractAaveReserve(broken, 'EURC')).toBeNull();
  });
});

describe('extractJupiterEurc', () => {
  // Field values taken from a live response.
  const live = [
    { symbol: 'jlUSDC', totalAssets: 495_023_717_060_000, totalRate: 574, asset: { symbol: 'USDC', decimals: 6 } },
    { symbol: 'jlEURC', totalAssets: 4_468_096_467_523, totalRate: 253, asset: { symbol: 'EURC', decimals: 6 } },
  ];

  it('converts basis points to a percentage and raw units to EURC', () => {
    expect(extractJupiterEurc(live)).toEqual({ apy: 2.53, tvl: 4_468_096 });
  });

  it('handles totalAssets arriving as a string', () => {
    const asString = [{ ...live[1], totalAssets: '4468096467523' }];
    expect(extractJupiterEurc(asString)).toEqual({ apy: 2.53, tvl: 4_468_096 });
  });

  it('returns null when no EURC market is listed', () => {
    expect(extractJupiterEurc([live[0]])).toBeNull();
    expect(extractJupiterEurc([])).toBeNull();
  });
});

describe('mergePools', () => {
  const existing = {
    aaveBase: { apy: 0.44, tvl: 20_960_000 },
    etherfiOptimism: { apy: 5.29, tvl: 6_770_000 },
  };

  it('records the prior figures so changes can be shown', () => {
    const { merged, changes } = mergePools(existing, {
      aaveBase: { apy: 0.51, tvl: 21_000_000 },
    });

    expect(merged.aaveBase).toEqual({
      apy: 0.51,
      tvl: 21_000_000,
      previousApy: 0.44,
      previousTvl: 20_960_000,
    });
    expect(changes).toHaveLength(1);
    expect(changes[0].key).toBe('aaveBase');
  });

  it('leaves manually maintained pools exactly as they are', () => {
    const { merged } = mergePools(existing, { aaveBase: { apy: 0.51, tvl: 21_000_000 } });

    for (const key of MANUAL_POOLS) {
      expect(merged[key]).toEqual(existing[key]);
    }
  });

  it('reports no change when the values are identical', () => {
    const { merged, changes } = mergePools(existing, {
      aaveBase: { apy: 0.44, tvl: 20_960_000 },
    });

    expect(changes).toEqual([]);
    // Untouched, so a stale previous value is not introduced.
    expect(merged.aaveBase).toEqual(existing.aaveBase);
  });

  it('does not overwrite the previous values on an unchanged pool', () => {
    const withHistory = { aaveBase: { apy: 0.44, tvl: 20_960_000, previousApy: 0.4, previousTvl: 20_000_000 } };
    const { merged } = mergePools(withHistory, { aaveBase: { apy: 0.44, tvl: 20_960_000 } });

    expect(merged.aaveBase.previousApy).toBe(0.4);
  });

  it('adds a pool it has never seen without inventing a previous value', () => {
    const { merged } = mergePools({}, { newPool: { apy: 1, tvl: 2 } });

    expect(merged.newPool).toEqual({ apy: 1, tvl: 2 });
    expect(merged.newPool.previousApy).toBeUndefined();
  });

  it('never drops pools that the fetch did not cover', () => {
    const { merged } = mergePools(existing, {});
    expect(Object.keys(merged).sort()).toEqual(Object.keys(existing).sort());
  });
});
