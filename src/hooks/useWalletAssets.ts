/**
 * Reads the connected wallet's token balances across all supported chains.
 * Covers: ETH/POL/AVAX (native), USDC, USDT, DAI, EURC per chain.
 * Uses fixed hook calls (no dynamic loops).
 */
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/lib/contracts';

// ── Token prices from CoinGecko (free, no key) ───────────────────────────────

interface CoinGeckoPrices {
  ethereum: { usd: number };
  'matic-network': { usd: number };
  'avalanche-2': { usd: number };
  'euro-coin': { usd: number };
}

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

function useNativePrices() {
  return useQuery({
    queryKey: ['native-prices'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,avalanche-2,euro-coin&vs_currencies=usd'
      );
      if (!res.ok) throw new Error('Price fetch failed');
      const json = await res.json() as Partial<CoinGeckoPrices>;
      return {
        eth:  json['ethereum']?.usd        ?? 0,
        pol:  json['matic-network']?.usd   ?? 0,
        avax: json['avalanche-2']?.usd     ?? 0,
        eurc: json['euro-coin']?.usd       ?? 1.09,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── Low-level balance hooks ───────────────────────────────────────────────────

function useTokenBalance(chainId: number, tokenAddress: `0x${string}`, decimals: number, userAddress?: `0x${string}`) {
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: chainId as 1 | 8453 | 42161 | 10 | 137 | 43114,
    query: { enabled: !!userAddress, staleTime: 30_000 },
  });
  return data ? Number(formatUnits(data as bigint, decimals)) : 0;
}

function useNativeBalance(chainId: number, userAddress?: `0x${string}`) {
  const { data } = useBalance({
    address: userAddress,
    chainId: chainId as 1 | 8453 | 42161 | 10 | 137 | 43114,
    query: { enabled: !!userAddress, staleTime: 30_000 },
  });
  return data ? Number(data.formatted) : 0;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export type BreakdownItem = {
  chainId: number; chainName: string; symbol: string;
  tokenAddress: string; decimals: number; balance: number; amountUsd: number;
};

export function useWalletAssets() {
  const { address } = useAccount();
  const { data: prices = { eth: 0, pol: 0, avax: 0, eurc: 1.09 } } = useNativePrices();

  // ── Native balances (6 chains)
  const ethEthereum  = useNativeBalance(1,     address);
  const ethBase      = useNativeBalance(8453,  address);
  const ethArbitrum  = useNativeBalance(42161, address);
  const ethOptimism  = useNativeBalance(10,    address);
  const polPolygon   = useNativeBalance(137,   address);
  const avaxAvalanche= useNativeBalance(43114, address);

  // ── USDC (5 chains)
  const usdcEth  = useTokenBalance(1,     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6,  address);
  const usdcBase = useTokenBalance(8453,  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6,  address);
  const usdcArb  = useTokenBalance(42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6,  address);
  const usdcOpt  = useTokenBalance(10,    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 6,  address);
  const usdcPoly = useTokenBalance(137,   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 6,  address);
  const usdcAvax = useTokenBalance(43114, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6,  address);

  // ── USDT (4 chains)
  const usdtEth  = useTokenBalance(1,     '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6,  address);
  const usdtArb  = useTokenBalance(42161, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6,  address);
  const usdtOpt  = useTokenBalance(10,    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6,  address);
  const usdtPoly = useTokenBalance(137,   '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6,  address);

  // ── DAI (Ethereum)
  const daiEth   = useTokenBalance(1,     '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, address);

  // ── EURC (Ethereum + Base)
  const eurcEth  = useTokenBalance(1,     '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c', 6,  address);
  const eurcBase = useTokenBalance(8453,  '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', 6,  address);

  // ── Aggregates (for YieldCalculator)
  const totalEth    = ethEthereum + ethBase + ethArbitrum + ethOptimism;
  const ethBalanceUsd = totalEth * prices.eth;
  const usdBalance  = usdcEth + usdcBase + usdcArb + usdcOpt + usdcPoly + usdcAvax
                    + usdtEth + usdtArb + usdtOpt + usdtPoly + daiEth;

  // ── Per-token breakdown for UI ────────────────────────────────────────────
  const NATIVE = '0x0000000000000000000000000000000000000000';
  const items: BreakdownItem[] = [];

  const push = (chainId: number, chainName: string, symbol: string, tokenAddress: string, decimals: number, balance: number, amountUsd: number) => {
    if (balance < 0.00001) return;
    items.push({ chainId, chainName, symbol, tokenAddress, decimals, balance, amountUsd });
  };

  // Native
  push(1,     'Ethereum', 'ETH',  NATIVE, 18, ethEthereum,   ethEthereum   * prices.eth);
  push(8453,  'Base',     'ETH',  NATIVE, 18, ethBase,       ethBase       * prices.eth);
  push(42161, 'Arbitrum', 'ETH',  NATIVE, 18, ethArbitrum,   ethArbitrum   * prices.eth);
  push(10,    'Optimism', 'ETH',  NATIVE, 18, ethOptimism,   ethOptimism   * prices.eth);
  push(137,   'Polygon',  'POL',  NATIVE, 18, polPolygon,    polPolygon    * prices.pol);
  push(43114, 'Avalanche','AVAX', NATIVE, 18, avaxAvalanche, avaxAvalanche * prices.avax);

  // USDC
  push(1,     'Ethereum', 'USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, usdcEth,  usdcEth);
  push(8453,  'Base',     'USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, usdcBase, usdcBase);
  push(42161, 'Arbitrum', 'USDC', '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, usdcArb,  usdcArb);
  push(10,    'Optimism', 'USDC', '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 6, usdcOpt,  usdcOpt);
  push(137,   'Polygon',  'USDC', '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 6, usdcPoly, usdcPoly);
  push(43114, 'Avalanche','USDC', '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6, usdcAvax, usdcAvax);

  // USDT
  push(1,     'Ethereum', 'USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, usdtEth,  usdtEth);
  push(42161, 'Arbitrum', 'USDT', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6, usdtArb,  usdtArb);
  push(10,    'Optimism', 'USDT', '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6, usdtOpt,  usdtOpt);
  push(137,   'Polygon',  'USDT', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6, usdtPoly, usdtPoly);

  // DAI
  push(1,     'Ethereum', 'DAI',  '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, daiEth, daiEth);

  // EURC
  push(1,     'Ethereum', 'EURC', '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c', 6, eurcEth,  eurcEth  * prices.eurc);
  push(8453,  'Base',     'EURC', '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', 6, eurcBase, eurcBase * prices.eurc);

  items.sort((a, b) => b.amountUsd - a.amountUsd);

  return {
    ethBalanceUsd,
    ethBalanceRaw: totalEth,
    usdBalance,
    isConnected: !!address,
    breakdown: items,
    ethPrice: prices.eth,
  };
}

// Export token list for reuse
export { };
