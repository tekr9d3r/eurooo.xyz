/**
 * Fetches protocol APY/TVL data from the database (populated by edge function from DeFi Llama).
 * Falls back to hardcoded values if no data is available yet.
 * Includes previous snapshot data for calculating % changes.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FALLBACK_POOL_DATA } from '@/lib/yields/registry';

export interface PoolData {
  apy: number;
  tvl: number;
  previousApy?: number;
  previousTvl?: number;
}

// Fallback values (used when no database data exists yet). Maintained in the
// shared yield registry so the app and the public API never disagree.
// Jupiter and Ether.fi are not available via DeFi Llama, so their registry
// entries are the only source for those two.
const FALLBACK_DATA = FALLBACK_POOL_DATA;

const POOL_KEYS = Object.keys(FALLBACK_DATA);

async function fetchSnapshotData(): Promise<Record<string, PoolData>> {
  // Get the latest snapshot timestamp
  const { data: latestRow } = await supabase
    .from('protocol_snapshots')
    .select('fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (!latestRow) {
    // No data in database yet - return fallback
    return Object.fromEntries(
      POOL_KEYS.map((key) => [key, FALLBACK_DATA[key]])
    );
  }

  const latestTime = latestRow.fetched_at;

  // Get the latest snapshot for all pools
  const { data: latestData } = await supabase
    .from('protocol_snapshots')
    .select('pool_key, apy, tvl')
    .eq('fetched_at', latestTime);

  // Get the previous snapshot (the one before the latest)
  const { data: previousRow } = await supabase
    .from('protocol_snapshots')
    .select('fetched_at')
    .lt('fetched_at', latestTime)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  let previousMap: Record<string, { apy: number; tvl: number }> = {};
  if (previousRow) {
    const { data: prevData } = await supabase
      .from('protocol_snapshots')
      .select('pool_key, apy, tvl')
      .eq('fetched_at', previousRow.fetched_at);

    if (prevData) {
      previousMap = Object.fromEntries(
        prevData.map((r) => [r.pool_key, { apy: Number(r.apy), tvl: Number(r.tvl) }])
      );
    }
  }

  // Build the result map
  const latestMap: Record<string, { apy: number; tvl: number }> = {};
  if (latestData) {
    for (const row of latestData) {
      latestMap[row.pool_key] = { apy: Number(row.apy), tvl: Number(row.tvl) };
    }
  }

  const result: Record<string, PoolData> = {};
  for (const key of POOL_KEYS) {
    const latest = latestMap[key];
    const previous = previousMap[key];
    const fallback = FALLBACK_DATA[key];

    result[key] = {
      apy: latest?.apy ?? fallback.apy,
      tvl: latest?.tvl ?? fallback.tvl,
      previousApy: previous?.apy,
      previousTvl: previous?.tvl,
    };
  }

  return result;
}

export function useDefiLlamaData() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['protocol-snapshots'],
    queryFn: fetchSnapshotData,
    staleTime: 30 * 60 * 1000, // 30 minute cache
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  });

  const get = (key: string): PoolData => {
    if (data?.[key]) return data[key];
    return FALLBACK_DATA[key] ?? { apy: 0, tvl: 0 };
  };

  return {
    // Aave
    aaveEthereum: get('aaveEthereum'),
    aaveBase: get('aaveBase'),
    aaveGnosis: get('aaveGnosis'),
    aaveAvalanche: get('aaveAvalanche'),
    
    // Other protocols
    yoBase: get('yoBase'),
    summerBase: get('summerBase'),
    
    // Morpho - Ethereum
    morphoGauntlet: get('morphoGauntlet'),
    morphoPrime: get('morphoPrime'),
    morphoKpk: get('morphoKpk'),
    
    // Morpho - Ethereum (EURCV)
    morphoSteakhouseEurcv: get('morphoSteakhouseEurcv'),
    morphoSteakhousePrimeInstant: get('morphoSteakhousePrimeInstant'),
    
    // Morpho - Base
    morphoMoonwell: get('morphoMoonwell'),
    morphoSteakhouse: get('morphoSteakhouse'),
    morphoSteakhousePrime: get('morphoSteakhousePrime'),
    
    // Fluid
    fluidBase: get('fluidBase'),
    
    // Moonwell
    moonwellBase: get('moonwellBase'),
    
    // Solana (hardcoded - not available via APIs)
    jupiterSolana: get('jupiterSolana'),

    // Ether.fi
    etherfiOptimism: get('etherfiOptimism'),
    
    isLoading,
    refetch,
  };
}
