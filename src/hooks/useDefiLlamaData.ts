/**
 * Fetches protocol APY/TVL data from the database (populated by edge function from DeFi Llama).
 * Falls back to hardcoded values if no data is available yet.
 * Includes previous snapshot data for calculating % changes.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PoolData {
  apy: number;
  tvl: number;
  previousApy?: number;
  previousTvl?: number;
}

// Fallback hardcoded values (used when no database data exists yet)
const FALLBACK_DATA: Record<string, { apy: number; tvl: number }> = {
  aaveEthereum: { apy: 2.42, tvl: 75_480_000 },
  aaveBase: { apy: 0.44, tvl: 20_960_000 },
  aaveGnosis: { apy: 3.14, tvl: 16_350_000 },
  aaveAvalanche: { apy: 1.93, tvl: 1_250_000 },
  yoBase: { apy: 2.26, tvl: 1_710_000 },
  summerBase: { apy: 2.50, tvl: 582_000 },
  morphoGauntlet: { apy: 3.44, tvl: 5_440_000 },
  morphoPrime: { apy: 0.78, tvl: 5_780_000 },
  morphoKpk: { apy: 3.57, tvl: 3_000_000 },
  morphoMoonwell: { apy: 1.17, tvl: 5_530_000 },
  morphoSteakhouse: { apy: 0.57, tvl: 5_190_000 },
  morphoSteakhousePrime: { apy: 2.78, tvl: 4_190_000 },
  fluidBase: { apy: 2.77, tvl: 2_768_000 },
  moonwellBase: { apy: 1.10, tvl: 5_533_000 },
  // Jupiter and Drift EURC not available via their APIs - hardcoded
  jupiterSolana: { apy: 2.76, tvl: 16_400_000 },
  driftSolana: { apy: 1.68, tvl: 566_000 },
};

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
    driftSolana: get('driftSolana'),
    
    isLoading,
    refetch,
  };
}
