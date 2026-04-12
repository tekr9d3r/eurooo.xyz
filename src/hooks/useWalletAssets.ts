/**
 * Fetches ALL token balances for the connected wallet across supported chains
 * using Ankr's ankr_getAccountBalance multichain API — one call instead of
 * 24+ individual RPC calls, returns every token the wallet holds.
 */
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';

// ── Chain map: Ankr blockchain name → chain metadata ─────────────────────────

const ANKR_CHAINS = [
  { blockchain: 'eth',       chainId: 1,     chainName: 'Ethereum' },
  { blockchain: 'base',      chainId: 8453,  chainName: 'Base' },
  { blockchain: 'arbitrum',  chainId: 42161, chainName: 'Arbitrum' },
  { blockchain: 'optimism',  chainId: 10,    chainName: 'Optimism' },
  { blockchain: 'polygon',   chainId: 137,   chainName: 'Polygon' },
  { blockchain: 'avalanche', chainId: 43114, chainName: 'Avalanche' },
  { blockchain: 'gnosis',    chainId: 100,   chainName: 'Gnosis' },
] as const;

// ── Ankr response types ───────────────────────────────────────────────────────

interface AnkrAsset {
  blockchain: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenType: 'NATIVE' | 'ERC20';
  contractAddress?: string;
  balance: string;       // decimal string e.g. "1.23456"
  balanceUsd: string;    // decimal string e.g. "2345.67"
  tokenPrice: string;    // USD price per 1 token
}

interface AnkrResponse {
  result?: { assets: AnkrAsset[]; totalBalanceUsd: string };
  error?: { message: string };
}

// ── Public types ──────────────────────────────────────────────────────────────

export type BreakdownItem = {
  chainId: number;
  chainName: string;
  symbol: string;
  tokenAddress: string;
  decimals: number;
  balance: number;
  amountUsd: number;
};

const NATIVE = '0x0000000000000000000000000000000000000000';

// ── Ankr fetch ────────────────────────────────────────────────────────────────

async function fetchAnkrBalances(address: string): Promise<BreakdownItem[]> {
  const res = await fetch('https://rpc.ankr.com/multichain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'ankr_getAccountBalance',
      params: {
        walletAddress: address,
        blockchain: ANKR_CHAINS.map(c => c.blockchain),
        onlyWhitelisted: false,
        pageSize: 100,
      },
      id: 1,
    }),
  });

  if (!res.ok) throw new Error(`Ankr request failed: ${res.status}`);
  const json: AnkrResponse = await res.json();
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error('Empty Ankr response');

  const chainById = Object.fromEntries(ANKR_CHAINS.map(c => [c.blockchain, c]));

  const items: BreakdownItem[] = [];
  for (const asset of json.result.assets) {
    const chain = chainById[asset.blockchain];
    if (!chain) continue;

    const balance = parseFloat(asset.balance);
    const amountUsd = parseFloat(asset.balanceUsd);
    if (balance < 0.000001) continue;

    items.push({
      chainId:      chain.chainId,
      chainName:    chain.chainName,
      symbol:       asset.tokenSymbol,
      tokenAddress: asset.tokenType === 'NATIVE' ? NATIVE : (asset.contractAddress ?? NATIVE),
      decimals:     asset.tokenDecimals,
      balance,
      amountUsd,
    });
  }

  items.sort((a, b) => b.amountUsd - a.amountUsd);
  return items;
}

// ── ETH price (CoinGecko) — used by yield calculator when not connected ───────

export function useEthPriceUsd() {
  return useQuery<number>({
    queryKey: ['eth-price-usd'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      if (!res.ok) throw new Error('ETH price fetch failed');
      const json = await res.json() as { ethereum: { usd: number } };
      return json.ethereum.usd;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useWalletAssets() {
  const { address } = useAccount();

  const { data: breakdown = [] } = useQuery({
    queryKey: ['ankr-balances', address],
    queryFn: () => fetchAnkrBalances(address!),
    enabled: !!address,
    staleTime: 30_000,
    retry: 1,
  });

  // Derived aggregates
  const ethItems    = breakdown.filter(b => b.symbol === 'ETH');
  const ethBalanceRaw = ethItems.reduce((s, b) => s + b.balance, 0);
  const ethBalanceUsd = ethItems.reduce((s, b) => s + b.amountUsd, 0);
  const usdBalance    = breakdown
    .filter(b => ['USDC', 'USDT', 'DAI'].includes(b.symbol))
    .reduce((s, b) => s + b.balance, 0);
  const ethPrice = ethBalanceRaw > 0 ? ethBalanceUsd / ethBalanceRaw : 0;

  return {
    ethBalanceUsd,
    ethBalanceRaw,
    usdBalance,
    isConnected: !!address,
    breakdown,
    ethPrice,
  };
}
