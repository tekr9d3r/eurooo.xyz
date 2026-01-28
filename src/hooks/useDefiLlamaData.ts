/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-01-28
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 3.06, tvl: 71_900_000 },
  aaveBase: { apy: 1.58, tvl: 21_720_000 },
  aaveGnosis: { apy: 3.41, tvl: 16_000_000 },
  
  // Other protocols
  yoBase: { apy: 6.02, tvl: 1_780_000 },
  summerBase: { apy: 3.22, tvl: 969_800 },
  
  // Morpho vaults
  morphoGauntlet: { apy: 3.76, tvl: 10_020_000 },
  morphoPrime: { apy: 5.96, tvl: 14_000_000 },
  morphoKpk: { apy: 4.37, tvl: 2_010_000 },
  
  // Fluid
  fluidBase: { apy: 4.35, tvl: 2_695_000 },
} as const;

export function useDefiLlamaData() {
  // No-op refetch since data is hardcoded
  const refetch = () => {};

  return {
    // Aave
    aaveEthereum: PROTOCOL_DATA.aaveEthereum,
    aaveBase: PROTOCOL_DATA.aaveBase,
    aaveGnosis: PROTOCOL_DATA.aaveGnosis,
    
    // Other protocols
    yoBase: PROTOCOL_DATA.yoBase,
    summerBase: PROTOCOL_DATA.summerBase,
    
    // Morpho
    morphoGauntlet: PROTOCOL_DATA.morphoGauntlet,
    morphoPrime: PROTOCOL_DATA.morphoPrime,
    morphoKpk: PROTOCOL_DATA.morphoKpk,
    
    // Fluid
    fluidBase: PROTOCOL_DATA.fluidBase,
    
    isLoading: false,
    refetch,
  };
}
