/**
 * Reads the connected wallet's ETH and USD stablecoin balances
 * across all supported chains. Uses fixed hook calls (no dynamic loops).
 */
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { ERC20_ABI } from '@/lib/contracts';

// ── ETH price from CoinGecko (free, no key) ──────────────────────────────────

interface CoinGeckoPrice { ethereum: { usd: number } }

export function useEthPriceUsd() {
  return useQuery<number>({
    queryKey: ['eth-price-usd'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      if (!res.ok) throw new Error('ETH price fetch failed');
      const json: CoinGeckoPrice = await res.json();
      return json.ethereum.usd;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ── USD stablecoin addresses ──────────────────────────────────────────────────
// USDC + USDT per chain (skip Polygon USDT — it's USDT bridged, same decimals)

const USD_TOKENS: { chainId: number; address: `0x${string}`; decimals: number }[] = [
  // Ethereum
  { chainId: 1,     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6  }, // USDC
  { chainId: 1,     address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6  }, // USDT
  { chainId: 1,     address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }, // DAI
  // Base
  { chainId: 8453,  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6  }, // USDC
  // Arbitrum
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6  }, // USDC
  { chainId: 42161, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6  }, // USDT
  // Optimism
  { chainId: 10,    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6  }, // USDC
  { chainId: 10,    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6  }, // USDT
  // Polygon
  { chainId: 137,   address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6  }, // USDC
  { chainId: 137,   address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6  }, // USDT
  // Avalanche
  { chainId: 43114, address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6  }, // USDC
];

function useUsdTokenBalance(chainId: number, address: `0x${string}`, decimals: number, userAddress?: `0x${string}`) {
  const { data } = useReadContract({
    address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: chainId as 1 | 8453 | 42161 | 10 | 137 | 43114,
    query: { enabled: !!userAddress, staleTime: 30_000 },
  });
  return data ? Number(formatUnits(data as bigint, decimals)) : 0;
}

function useEthChainBalance(chainId: number, userAddress?: `0x${string}`) {
  const { data } = useBalance({
    address: userAddress,
    chainId: chainId as 1 | 8453 | 42161 | 10 | 137 | 43114,
    query: { enabled: !!userAddress, staleTime: 30_000 },
  });
  return data ? Number(data.formatted) : 0;
}

export function useWalletAssets() {
  const { address } = useAccount();
  const { data: ethPrice = 0 } = useEthPriceUsd();

  // ETH balances per chain (6 fixed calls)
  const ethEthereum  = useEthChainBalance(1,     address);
  const ethBase      = useEthChainBalance(8453,  address);
  const ethArbitrum  = useEthChainBalance(42161, address);
  const ethOptimism  = useEthChainBalance(10,    address);
  const ethPolygon   = useEthChainBalance(137,   address);
  const ethAvalanche = useEthChainBalance(43114, address);

  // USD stablecoin balances (11 fixed calls matching USD_TOKENS above)
  const usd0  = useUsdTokenBalance(1,     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6,  address);
  const usd1  = useUsdTokenBalance(1,     '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6,  address);
  const usd2  = useUsdTokenBalance(1,     '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, address);
  const usd3  = useUsdTokenBalance(8453,  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6,  address);
  const usd4  = useUsdTokenBalance(42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6,  address);
  const usd5  = useUsdTokenBalance(42161, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6,  address);
  const usd6  = useUsdTokenBalance(10,    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', 6,  address);
  const usd7  = useUsdTokenBalance(10,    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6,  address);
  const usd8  = useUsdTokenBalance(137,   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 6,  address);
  const usd9  = useUsdTokenBalance(137,   '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6,  address);
  const usd10 = useUsdTokenBalance(43114, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6,  address);

  const totalEth = ethEthereum + ethBase + ethArbitrum + ethOptimism + ethPolygon + ethAvalanche;
  const ethBalanceUsd = totalEth * ethPrice;
  const usdBalance = usd0 + usd1 + usd2 + usd3 + usd4 + usd5 + usd6 + usd7 + usd8 + usd9 + usd10;

  return {
    ethBalanceUsd,
    ethBalanceRaw: totalEth,
    usdBalance,
    isConnected: !!address,
  };
}

// Export token list for reuse
export { USD_TOKENS };
