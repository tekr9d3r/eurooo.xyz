/**
 * Hardcoded APY and TVL data - Updated weekly
 * Last updated: 2026-02-17
 */

export interface PoolData {
  apy: number;
  tvl: number;
}

// Hardcoded values - update these weekly
const PROTOCOL_DATA = {
  // Aave pools
  aaveEthereum: { apy: 2.42, tvl: 75_480_000 },
  aaveBase: { apy: 0.44, tvl: 20_960_000 },
  aaveGnosis: { apy: 3.14, tvl: 16_350_000 },
  aaveAvalanche: { apy: 1.93, tvl: 1_250_000 },
  
  // Other protocols
  yoBase: { apy: 2.26, tvl: 1_710_000 },
  summerBase: { apy: 2.50, tvl: 582_000 },
  
  // Morpho vaults - Ethereum
  morphoGauntlet: { apy: 3.44, tvl: 5_440_000 },
  morphoPrime: { apy: 0.78, tvl: 5_780_000 },
  morphoKpk: { apy: 3.57, tvl: 3_000_000 },
  
  // Morpho vaults - Base
  morphoMoonwell: { apy: 1.17, tvl: 5_530_000 },
  morphoSteakhouse: { apy: 0.57, tvl: 5_190_000 },
  morphoSteakhousePrime: { apy: 2.78, tvl: 4_190_000 },
  
  // Fluid
  fluidBase: { apy: 2.77, tvl: 2_768_000 },
  
  // Moonwell
  moonwellBase: { apy: 1.10, tvl: 5_533_000 },
  
  // Solana protocols (external)
  jupiterSolana: { apy: 2.82, tvl: 16_000_000 },
  driftSolana: { apy: 2.02, tvl: 563_000 },
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
