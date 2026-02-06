/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-02-06
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 2.04, tvl: 73_430_000 },
  aaveBase: { apy: 1.43, tvl: 21_450_000 },
  aaveGnosis: { apy: 3.22, tvl: 16_240_000 },
  aaveAvalanche: { apy: 1.58, tvl: 1_310_000 },
  
  // Other protocols
  yoBase: { apy: 3.69, tvl: 1_950_000 },
  summerBase: { apy: 2.91, tvl: 891_390 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 5.33, tvl: 7_190_000 },
  morphoPrime: { apy: 4.53, tvl: 8_150_000 },
  morphoKpk: { apy: 3.95, tvl: 2_030_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 1.07, tvl: 5_510_000 },
  morphoSteakhouse: { apy: 0.93, tvl: 5_620_000 },
  morphoSteakhousePrime: { apy: 0.01, tvl: 4_600_000 },
  
  // Fluid
  fluidBase: { apy: 2.54, tvl: 2_914_000 },
  
  // Solana protocols (external)
  jupiterSolana: { apy: 3.09, tvl: 14_600_000 },
  driftSolana: { apy: 1.29, tvl: 737_000 },
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
    
    // Solana (external)
    jupiterSolana: PROTOCOL_DATA.jupiterSolana,
    driftSolana: PROTOCOL_DATA.driftSolana,
    
    isLoading: false,
    refetch,
  };
}
