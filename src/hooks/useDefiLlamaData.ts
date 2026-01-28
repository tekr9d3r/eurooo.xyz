import { useQuery } from '@tanstack/react-query';

// DefiLlama pool response structure
interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyMean30d?: number;
  underlyingTokens?: string[];
}

interface DefiLlamaResponse {
  status: string;
  data: DefiLlamaPool[];
}

// Protocol identifiers for our supported pools
export type ProtocolPoolId = 
  | 'aave-ethereum'
  | 'aave-base'
  | 'aave-gnosis'
  | 'morpho-gauntlet'
  | 'morpho-prime'
  | 'morpho-kpk'
  | 'summer-base'
  | 'yo-base'
  | 'fluid-base';

export interface PoolData {
  apy: number;
  tvl: number;
}

// Known pool addresses for matching (lowercase for comparison)
const POOL_ADDRESSES: Record<string, ProtocolPoolId> = {
  // Morpho vaults on Ethereum
  '0x2ed10624315b74a78f11fabedaa1a228c198aefb': 'morpho-gauntlet',
  '0xa2a2daa37ce69b7e024420e0cafa7b0e0f0a08c2': 'morpho-prime',
  '0x58beeeb1c23709e59eb37b03504246edb30c9b74': 'morpho-kpk',
  // Summer.fi on Base
  '0x83dcb40f2c6c3fd2b4f9e4b4f2f3f57a8faba7a9': 'summer-base',
  // YO on Base
  '0xbeefd1799a5c5e0d0e2e2e47a8f8e8d3d0f0e8d7': 'yo-base',
  // Fluid on Base
  '0x1943fa26360f038230442525cf1b9125b5dcb401': 'fluid-base',
};

// Fallback APY values if DefiLlama doesn't have data
const FALLBACK_APYS: Record<ProtocolPoolId, number> = {
  'aave-ethereum': 2.5,
  'aave-base': 3.0,
  'aave-gnosis': 2.8,
  'morpho-gauntlet': 4.38,
  'morpho-prime': 3.85,
  'morpho-kpk': 4.12,
  'summer-base': 3.5,
  'yo-base': 5.2,
  'fluid-base': 5.01,
};

async function fetchDefiLlamaData(): Promise<Record<ProtocolPoolId, PoolData>> {
  const result: Record<ProtocolPoolId, PoolData> = {
    'aave-ethereum': { apy: FALLBACK_APYS['aave-ethereum'], tvl: 0 },
    'aave-base': { apy: FALLBACK_APYS['aave-base'], tvl: 0 },
    'aave-gnosis': { apy: FALLBACK_APYS['aave-gnosis'], tvl: 0 },
    'morpho-gauntlet': { apy: FALLBACK_APYS['morpho-gauntlet'], tvl: 0 },
    'morpho-prime': { apy: FALLBACK_APYS['morpho-prime'], tvl: 0 },
    'morpho-kpk': { apy: FALLBACK_APYS['morpho-kpk'], tvl: 0 },
    'summer-base': { apy: FALLBACK_APYS['summer-base'], tvl: 0 },
    'yo-base': { apy: FALLBACK_APYS['yo-base'], tvl: 0 },
    'fluid-base': { apy: FALLBACK_APYS['fluid-base'], tvl: 0 },
  };

  try {
    const response = await fetch('https://yields.llama.fi/pools');
    
    if (!response.ok) {
      console.warn('[DefiLlama] API request failed:', response.status);
      return result;
    }

    const data: DefiLlamaResponse = await response.json();
    
    if (data.status !== 'success' || !Array.isArray(data.data)) {
      console.warn('[DefiLlama] Invalid response format');
      return result;
    }

    // Filter for EUR stablecoins (EURC, EURe, EURE)
    const eurPools = data.data.filter(pool => 
      pool.symbol && (
        pool.symbol.toUpperCase().includes('EURC') ||
        pool.symbol.toUpperCase().includes('EURE') ||
        pool.symbol.toUpperCase() === 'EUR'
      )
    );

    console.log(`[DefiLlama] Found ${eurPools.length} EUR-related pools`);

    for (const pool of eurPools) {
      const poolAddress = pool.pool.toLowerCase();
      const chain = pool.chain.toLowerCase();
      const project = pool.project.toLowerCase();
      const symbol = pool.symbol.toUpperCase();
      
      // Use 30-day average APY if available, otherwise current APY
      const apy = pool.apyMean30d ?? pool.apy ?? 0;
      const tvl = pool.tvlUsd ?? 0;

      // Match by pool address first (most reliable)
      if (POOL_ADDRESSES[poolAddress]) {
        const poolId = POOL_ADDRESSES[poolAddress];
        result[poolId] = { apy, tvl };
        console.log(`[DefiLlama] Matched ${poolId} by address: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        continue;
      }

      // Match Aave V3 pools by project + chain + symbol
      if (project === 'aave-v3') {
        if (chain === 'ethereum' && symbol.includes('EURC')) {
          result['aave-ethereum'] = { apy, tvl };
          console.log(`[DefiLlama] Matched aave-ethereum: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        } else if (chain === 'base' && symbol.includes('EURC')) {
          result['aave-base'] = { apy, tvl };
          console.log(`[DefiLlama] Matched aave-base: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        } else if (chain === 'gnosis' && (symbol.includes('EURE') || symbol === 'EUR')) {
          result['aave-gnosis'] = { apy, tvl };
          console.log(`[DefiLlama] Matched aave-gnosis: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        }
        continue;
      }

      // Match Morpho Blue pools
      if (project === 'morpho-blue' || project === 'morpho') {
        // Try to identify by pool name or underlying tokens
        if (symbol.includes('EURC')) {
          // Check if we already have a better match
          if (result['morpho-gauntlet'].tvl === 0) {
            result['morpho-gauntlet'] = { apy, tvl };
            console.log(`[DefiLlama] Matched morpho-gauntlet: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
          }
        }
        continue;
      }

      // Match Summer.fi
      if ((project === 'summer-fi' || project === 'summerfi' || project === 'summer') && chain === 'base') {
        if (symbol.includes('EURC')) {
          result['summer-base'] = { apy, tvl };
          console.log(`[DefiLlama] Matched summer-base: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        }
        continue;
      }

      // Match Fluid
      if (project === 'fluid' && chain === 'base') {
        if (symbol.includes('EURC')) {
          result['fluid-base'] = { apy, tvl };
          console.log(`[DefiLlama] Matched fluid-base: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        }
        continue;
      }

      // Match YO Protocol
      if (project === 'yo' || project === 'yo-protocol') {
        if (chain === 'base' && (symbol.includes('EURC') || symbol.includes('EUR'))) {
          result['yo-base'] = { apy, tvl };
          console.log(`[DefiLlama] Matched yo-base: APY=${apy.toFixed(2)}%, TVL=$${tvl.toLocaleString()}`);
        }
        continue;
      }
    }

    return result;
  } catch (error) {
    console.error('[DefiLlama] Error fetching data:', error);
    return result;
  }
}

export function useDefiLlamaData() {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['defillama-yields'],
    queryFn: fetchDefiLlamaData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });

  // Helper function to get pool data with fallback
  const getPoolData = (poolId: ProtocolPoolId): PoolData => {
    if (data && data[poolId]) {
      return data[poolId];
    }
    return { apy: FALLBACK_APYS[poolId], tvl: 0 };
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    getPoolData,
    // Convenience getters for each protocol
    aaveEthereum: getPoolData('aave-ethereum'),
    aaveBase: getPoolData('aave-base'),
    aaveGnosis: getPoolData('aave-gnosis'),
    morphoGauntlet: getPoolData('morpho-gauntlet'),
    morphoPrime: getPoolData('morpho-prime'),
    morphoKpk: getPoolData('morpho-kpk'),
    summerBase: getPoolData('summer-base'),
    yoBase: getPoolData('yo-base'),
    fluidBase: getPoolData('fluid-base'),
  };
}
