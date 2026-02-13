/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-02-13
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 2.59, tvl: 70_640_000 },
  aaveBase: { apy: 0.42, tvl: 21_160_000 },
  aaveGnosis: { apy: 3.13, tvl: 16_370_000 },
  aaveAvalanche: { apy: 2.29, tvl: 1_220_000 },
  
  // Other protocols
  yoBase: { apy: 3.50, tvl: 1_680_000 },
  summerBase: { apy: 2.63, tvl: 623_000 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 3.54, tvl: 7_320_000 },
  morphoPrime: { apy: 0.65, tvl: 5_980_000 },
  morphoKpk: { apy: 3.75, tvl: 2_800_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 1.39, tvl: 5_980_000 },
  morphoSteakhouse: { apy: 0.31, tvl: 5_200_000 },
  morphoSteakhousePrime: { apy: 2.14, tvl: 4_110_000 },
  
  // Fluid
  fluidBase: { apy: 2.74, tvl: 2_780_000 },
  
  // Moonwell
  moonwellBase: { apy: 1.30, tvl: 5_980_000 },
  
  // Solana protocols (external)
  jupiterSolana: { apy: 0.22, tvl: 16_000_000 },
  driftSolana: { apy: 1.32, tvl: 850_000 },
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
    
    // Moonwell
    moonwellBase: PROTOCOL_DATA.moonwellBase,
    
    // Solana (external)
    jupiterSolana: PROTOCOL_DATA.jupiterSolana,
    driftSolana: PROTOCOL_DATA.driftSolana,
    
    isLoading: false,
    refetch,
  };
}
