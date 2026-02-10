/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-02-10
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 2.77, tvl: 67_850_000 },
  aaveBase: { apy: 0.41, tvl: 21_190_000 },
  aaveGnosis: { apy: 3.06, tvl: 16_560_000 },
  aaveAvalanche: { apy: 1.86, tvl: 1_230_000 },
  
  // Other protocols
  yoBase: { apy: 3.76, tvl: 1_650_000 },
  summerBase: { apy: 2.75, tvl: 625_520 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 4.35, tvl: 7_000_000 },
  morphoPrime: { apy: 4.53, tvl: 8_150_000 },
  morphoKpk: { apy: 4.58, tvl: 2_760_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 1.22, tvl: 5_910_000 },
  morphoSteakhouse: { apy: 0.49, tvl: 5_220_000 },
  morphoSteakhousePrime: { apy: 2.36, tvl: 4_180_000 },
  
  // Fluid
  fluidBase: { apy: 2.66, tvl: 2_921_000 },
  
  // Solana protocols (external)
  jupiterSolana: { apy: 2.76, tvl: 16_500_000 },
  driftSolana: { apy: 2.82, tvl: 593_000 },
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
