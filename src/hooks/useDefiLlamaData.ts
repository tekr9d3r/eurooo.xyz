/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-01-31
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 3.97, tvl: 64_920_000 },
  aaveBase: { apy: 1.59, tvl: 21_820_000 },
  aaveGnosis: { apy: 3.45, tvl: 16_040_000 },
  
  // Other protocols
  yoBase: { apy: 14.00, tvl: 1_810_000 },
  summerBase: { apy: 3.16, tvl: 938_620 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 4.01, tvl: 8_500_000 },
  morphoPrime: { apy: 4.35, tvl: 11_580_000 },
  morphoKpk: { apy: 4.29, tvl: 2_130_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 2.10, tvl: 6_630_000 },
  morphoSteakhouse: { apy: 1.87, tvl: 5_830_000 },
  morphoSteakhousePrime: { apy: 2.91, tvl: 4_710_000 },
  
  // Fluid
  fluidBase: { apy: 3.69, tvl: 2_882_000 },
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
