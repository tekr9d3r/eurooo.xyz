/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-02-02
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 3.67, tvl: 64_450_000 },
  aaveBase: { apy: 1.41, tvl: 22_290_000 },
  aaveGnosis: { apy: 3.34, tvl: 16_110_000 },
  aaveAvalanche: { apy: 2.71, tvl: 1_350_000 },
  
  // Other protocols
  yoBase: { apy: 18.07, tvl: 2_000_000 },
  summerBase: { apy: 3.07, tvl: 894_410 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 3.17, tvl: 7_980_000 },
  morphoPrime: { apy: 4.74, tvl: 9_710_000 },
  morphoKpk: { apy: 3.51, tvl: 2_310_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 0.76, tvl: 5_650_000 },
  morphoSteakhouse: { apy: 1.14, tvl: 6_020_000 },
  morphoSteakhousePrime: { apy: 3.10, tvl: 4_980_000 },
  
  // Fluid
  fluidBase: { apy: 3.06, tvl: 3_005_000 },
} as const;

export function useDefiLlamaData() {
  // No-op refetch since data is hardcoded
  const refetch = () => {};

  return {
    // Aave
    aaveEthereum: PROTOCOL_DATA.aaveEthereum,
    aaveBase: PROTOCOL_DATA.aaveBase,
    aaveGnosis: PROTOCOL_DATA.aaveGnosis,
    aaveAvalanche: PROTOCOL_DATA.aaveAvalanche,
    
    // Other protocols
    yoBase: PROTOCOL_DATA.yoBase,
    summerBase: PROTOCOL_DATA.summerBase,
    
    // Morpho - Ethereum
    morphoGauntlet: PROTOCOL_DATA.morphoGauntlet,
    morphoPrime: PROTOCOL_DATA.morphoPrime,
    morphoKpk: PROTOCOL_DATA.morphoKpk,
    
    // Morpho - Base
    morphoMoonwell: PROTOCOL_DATA.morphoMoonwell,
    morphoSteakhouse: PROTOCOL_DATA.morphoSteakhouse,
    morphoSteakhousePrime: PROTOCOL_DATA.morphoSteakhousePrime,
    
    // Fluid
    fluidBase: PROTOCOL_DATA.fluidBase,
    
    isLoading: false,
    refetch,
  };
}
