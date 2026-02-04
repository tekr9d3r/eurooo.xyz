import { useState, useEffect, useCallback } from 'react';

const DEFILLAMA_API = 'https://stablecoins.llama.fi/stablecoins';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface EURStablecoin {
  id: string;
  name: string;
  symbol: string;
  circulating: number;
  marketShare: number;
  chains: string[];
  pegMechanism: string;
}

export interface ChainBreakdown {
  chain: string;
  supply: number;
  percentage: number;
}

export interface StablecoinStats {
  totalSupply: number;
  totalSupplyPrevMonth: number;
  change30d: number;
  stablecoins: EURStablecoin[];
  byChain: ChainBreakdown[];
  lastUpdated: Date | null;
}

interface CacheEntry {
  data: StablecoinStats;
  timestamp: number;
}

interface DefiLlamaAsset {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  pegMechanism: string;
  circulating: {
    peggedEUR?: number;
  };
  circulatingPrevMonth?: {
    peggedEUR?: number;
  };
  chains: string[];
  chainCirculating: Record<string, { current: { peggedEUR?: number } }>;
}

let cache: CacheEntry | null = null;

export function useStablecoinStats() {
  const [data, setData] = useState<StablecoinStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // Check cache
    if (!force && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      setData(cache.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(DEFILLAMA_API);
      if (!response.ok) {
        throw new Error('Failed to fetch data from DefiLlama');
      }

      const json = await response.json();
      const peggedAssets: DefiLlamaAsset[] = json.peggedAssets || [];

      // Filter for EUR stablecoins only
      const eurAssets = peggedAssets.filter(
        (asset) => asset.pegType === 'peggedEUR'
      );

      // Calculate total supply
      const totalSupply = eurAssets.reduce((sum, asset) => {
        const circulating = asset.circulating?.peggedEUR || 0;
        return sum + circulating;
      }, 0);

      // Calculate total supply from previous month
      const totalSupplyPrevMonth = eurAssets.reduce((sum, asset) => {
        const circulatingPrev = asset.circulatingPrevMonth?.peggedEUR || 0;
        return sum + circulatingPrev;
      }, 0);

      // Calculate 30-day change percentage
      const change30d = totalSupplyPrevMonth > 0 
        ? ((totalSupply - totalSupplyPrevMonth) / totalSupplyPrevMonth) * 100 
        : 0;

      // Build stablecoins list with market share
      const stablecoins: EURStablecoin[] = eurAssets
        .map((asset) => {
          const circulating = asset.circulating?.peggedEUR || 0;
          return {
            id: asset.id,
            name: asset.name,
            symbol: asset.symbol,
            circulating,
            marketShare: totalSupply > 0 ? (circulating / totalSupply) * 100 : 0,
            chains: asset.chains || [],
            pegMechanism: asset.pegMechanism || 'Unknown',
          };
        })
        .filter((s) => s.circulating > 0)
        .sort((a, b) => b.circulating - a.circulating);

      // Aggregate supply by chain
      const chainTotals = new Map<string, number>();
      eurAssets.forEach((asset) => {
        if (asset.chainCirculating) {
          Object.entries(asset.chainCirculating).forEach(([chain, data]) => {
            const supply = data?.current?.peggedEUR || 0;
            if (supply > 0) {
              chainTotals.set(chain, (chainTotals.get(chain) || 0) + supply);
            }
          });
        }
      });

      const byChain: ChainBreakdown[] = Array.from(chainTotals.entries())
        .map(([chain, supply]) => ({
          chain,
          supply,
          percentage: totalSupply > 0 ? (supply / totalSupply) * 100 : 0,
        }))
        .sort((a, b) => b.supply - a.supply);

      const stats: StablecoinStats = {
        totalSupply,
        totalSupplyPrevMonth,
        change30d,
        stablecoins,
        byChain,
        lastUpdated: new Date(),
      };

      cache = { data: stats, timestamp: Date.now() };
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
  };
}
