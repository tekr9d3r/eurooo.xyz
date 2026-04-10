import { useQuery } from '@tanstack/react-query';

const EARN_API = '/earn-api';

export interface LiFiVault {
  address: string;
  network: string;
  chainId: number;
  slug: string;
  name: string;
  protocol: {
    name: string;
    url: string;
  };
  underlyingTokens: {
    address: string;
    symbol: string;
    decimals: number;
  }[];
  tags: string[];
  analytics: {
    apy: {
      base: number;
      reward: number | null;
      total: number;
    };
    apy1d: number | null;
    apy7d: number | null;
    apy30d: number | null;
    tvl: {
      usd: string;
    };
    updatedAt: string;
  };
  isTransactional: boolean;
  isRedeemable: boolean;
}

async function fetchAllEurVaults(): Promise<LiFiVault[]> {
  const all: LiFiVault[] = [];
  let cursor: string | null = null;

  while (true) {
    const params = new URLSearchParams({ sortBy: 'apy' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`${EARN_API}/v1/earn/vaults?${params}`);
    if (!res.ok) throw new Error(`Earn API error: ${res.status}`);

    const json = await res.json();
    const vaults: LiFiVault[] = json.data ?? [];

    // Filter for EUR stablecoins
    const eurVaults = vaults.filter((v) =>
      v.underlyingTokens.some((t) => t.symbol.toUpperCase().includes('EUR'))
    );
    all.push(...eurVaults);

    cursor = json.nextCursor ?? null;
    if (!cursor) break;
  }

  // Sort by total APY descending
  return all.sort((a, b) => (b.analytics.apy.total ?? 0) - (a.analytics.apy.total ?? 0));
}

export function useLiFiVaults() {
  return useQuery({
    queryKey: ['lifi-eur-vaults'],
    queryFn: fetchAllEurVaults,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
