/* eslint-disable react-hooks/rules-of-hooks --
 * useDefiLlamaData reads bundled JSON and calls no hooks itself, so it is a
 * plain function and safe to invoke outside a component.
 */
import { describe, it, expect } from 'vitest';

import poolData from '@/data/pool-data.json';
import { useDefiLlamaData } from '@/hooks/useDefiLlamaData';

const data = useDefiLlamaData();

const POOL_KEYS = [
  'aaveEthereum',
  'aaveBase',
  'aaveGnosis',
  'aaveAvalanche',
  'yoBase',
  'summerBase',
  'morphoGauntlet',
  'morphoPrime',
  'morphoSteakhouseEurcv',
  'morphoSteakhousePrimeInstant',
  'morphoMoonwell',
  'morphoSteakhouse',
  'morphoSteakhousePrime',
  'fluidBase',
  'moonwellBase',
  'jupiterSolana',
  'etherfiOptimism',
] as const;

describe('pool data file', () => {
  it('covers every pool the app renders', () => {
    expect(Object.keys(poolData.pools).sort()).toEqual([...POOL_KEYS].sort());
  });

  it('holds usable numbers for every pool', () => {
    for (const [key, pool] of Object.entries(poolData.pools)) {
      expect(typeof pool.apy, `${key} apy`).toBe('number');
      expect(typeof pool.tvl, `${key} tvl`).toBe('number');
      expect(pool.apy, `${key} apy`).toBeGreaterThanOrEqual(0);
      expect(pool.tvl, `${key} tvl`).toBeGreaterThan(0);
    }
  });
});

describe('useDefiLlamaData', () => {
  it('serves the values straight from the data file', () => {
    for (const key of POOL_KEYS) {
      expect(data[key], `${key} should be exposed`).toEqual(poolData.pools[key]);
    }
  });

  it('reports nothing to load, since the data ships with the bundle', () => {
    expect(data.isLoading).toBe(false);
    expect(() => data.refetch()).not.toThrow();
  });
});
