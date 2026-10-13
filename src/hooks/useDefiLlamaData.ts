/**
 * Protocol APY/TVL data, bundled at build time.
 *
 * Values live in src/data/pool-data.json and are refreshed daily by the
 * update-pool-data GitHub Action, which reads DeFi Llama and Jupiter's Lend
 * API. Pools with no upstream source (Ether.fi) are maintained by hand in that
 * file. Previous values are recorded by the same job and drive the change
 * indicators in the protocol table.
 */

import poolData from '@/data/pool-data.json';

export interface PoolData {
  apy: number;
  tvl: number;
  previousApy?: number;
  previousTvl?: number;
}

const POOLS = poolData.pools as Record<string, PoolData>;

const UNKNOWN_POOL: PoolData = { apy: 0, tvl: 0 };

export function useDefiLlamaData() {
  const get = (key: string): PoolData => POOLS[key] ?? UNKNOWN_POOL;

  return {
    // Aave
    aaveEthereum: get('aaveEthereum'),
    aaveBase: get('aaveBase'),
    aaveGnosis: get('aaveGnosis'),
    aaveAvalanche: get('aaveAvalanche'),

    // Other protocols
    yoBase: get('yoBase'),

    // Morpho - Ethereum
    morphoGauntlet: get('morphoGauntlet'),
    morphoPrime: get('morphoPrime'),

    // Morpho - Ethereum (EURCV)
    morphoSteakhouseEurcv: get('morphoSteakhouseEurcv'),
    morphoSteakhousePrimeInstant: get('morphoSteakhousePrimeInstant'),

    // Morpho - Base
    morphoMoonwell: get('morphoMoonwell'),
    morphoSteakhouse: get('morphoSteakhouse'),
    morphoSteakhousePrime: get('morphoSteakhousePrime'),

    // Fluid
    fluidBase: get('fluidBase'),

    // Solana
    jupiterSolana: get('jupiterSolana'),

    // Ether.fi
    etherfiOptimism: get('etherfiOptimism'),

    // The data ships with the bundle, so there is nothing to load or refetch.
    // Both are kept because the per-protocol hooks surface them alongside
    // their on-chain reads, which do still load and refetch.
    isLoading: false,
    refetch: () => {},
  };
}
