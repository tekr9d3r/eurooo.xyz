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

  // Detailed breakdown for UI display
  type BreakdownItem = {
    chainId: number; chainName: string; symbol: string;
    tokenAddress: string; decimals: number; balance: number; amountUsd: number;
  };
  const NATIVE_ADDR = '0x0000000000000000000000000000000000000000';
  const breakdown: BreakdownItem[] = [];

  // Native tokens
  if (ethEthereum  > 0.00001) breakdown.push({ chainId: 1,     chainName: 'Ethereum', symbol: 'ETH',  tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethEthereum,  amountUsd: ethEthereum  * ethPrice });
  if (ethBase      > 0.00001) breakdown.push({ chainId: 8453,  chainName: 'Base',     symbol: 'ETH',  tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethBase,      amountUsd: ethBase      * ethPrice });
  if (ethArbitrum  > 0.00001) breakdown.push({ chainId: 42161, chainName: 'Arbitrum', symbol: 'ETH',  tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethArbitrum,  amountUsd: ethArbitrum  * ethPrice });
  if (ethOptimism  > 0.00001) breakdown.push({ chainId: 10,    chainName: 'Optimism', symbol: 'ETH',  tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethOptimism,  amountUsd: ethOptimism  * ethPrice });
  if (ethPolygon   > 0.001)   breakdown.push({ chainId: 137,   chainName: 'Polygon',  symbol: 'POL',  tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethPolygon,   amountUsd: 0 /* POL price not tracked */ });
  if (ethAvalanche > 0.00001) breakdown.push({ chainId: 43114, chainName: 'Avalanche',symbol: 'AVAX', tokenAddress: NATIVE_ADDR, decimals: 18, balance: ethAvalanche, amountUsd: 0 /* AVAX price not tracked */ });

  // USD stablecoins
  if (usd0  > 0.01) breakdown.push({ chainId: 1,     chainName: 'Ethereum', symbol: 'USDC', tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6,  balance: usd0,  amountUsd: usd0  });
  if (usd1  > 0.01) breakdown.push({ chainId: 1,     chainName: 'Ethereum', symbol: 'USDT', tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6,  balance: usd1,  amountUsd: usd1  });
  if (usd2  > 0.01) breakdown.push({ chainId: 1,     chainName: 'Ethereum', symbol: 'DAI',  tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, balance: usd2,  amountUsd: usd2  });
  if (usd3  > 0.01) breakdown.push({ chainId: 8453,  chainName: 'Base',     symbol: 'USDC', tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6,  balance: usd3,  amountUsd: usd3  });
  if (usd4  > 0.01) breakdown.push({ chainId: 42161, chainName: 'Arbitrum', symbol: 'USDC', tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6,  balance: usd4,  amountUsd: usd4  });
  if (usd5  > 0.01) breakdown.push({ chainId: 42161, chainName: 'Arbitrum', symbol: 'USDT', tokenAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6,  balance: usd5,  amountUsd: usd5  });
  if (usd6  > 0.01) breakdown.push({ chainId: 10,    chainName: 'Optimism', symbol: 'USDC', tokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6,  balance: usd6,  amountUsd: usd6  });
  if (usd7  > 0.01) breakdown.push({ chainId: 10,    chainName: 'Optimism', symbol: 'USDT', tokenAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6,  balance: usd7,  amountUsd: usd7  });
  if (usd8  > 0.01) breakdown.push({ chainId: 137,   chainName: 'Polygon',  symbol: 'USDC', tokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6,  balance: usd8,  amountUsd: usd8  });
  if (usd9  > 0.01) breakdown.push({ chainId: 137,   chainName: 'Polygon',  symbol: 'USDT', tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6,  balance: usd9,  amountUsd: usd9  });
  if (usd10 > 0.01) breakdown.push({ chainId: 43114, chainName: 'Avalanche',symbol: 'USDC', tokenAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6,  balance: usd10, amountUsd: usd10 });

  breakdown.sort((a, b) => b.amountUsd - a.amountUsd);

  return {
    ethBalanceUsd,
    ethBalanceRaw: totalEth,
    usdBalance,
    isConnected: !!address,
    breakdown,
    ethPrice,
  };
}

// Export token list for reuse
export { USD_TOKENS };
