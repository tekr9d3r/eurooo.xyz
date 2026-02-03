import { useAccount, useReadContract, useChainId, useConfig } from 'wagmi';
import { EURC_ADDRESSES, ERC20_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

// Decimals per chain: EURC has 6 decimals, EURe on Gnosis has 18
const DECIMALS_BY_CHAIN: Record<number, number> = {
  1: 6,      // Ethereum EURC
  8453: 6,   // Base EURC
  100: 18,   // Gnosis EURe
  43114: 6,  // Avalanche EURC
};

export function useEURCBalance() {
  const config = useConfig();
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Safety check - if wagmi config isn't ready, return defaults
  const isReady = !!config;
  
  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const decimals = DECIMALS_BY_CHAIN[chainId] ?? 6;
  
  const queryEnabled = isReady && !!address && !!eurcAddress;
  
  const { data: balance, isLoading: isQueryLoading, error, refetch } = useReadContract({
    address: eurcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: queryEnabled,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Use correct decimals based on chain
  const formattedBalance = balance ? Number(formatUnits(balance, decimals)) : 0;
  
  // isLoading should be false if the query is disabled (unsupported chain)
  const isLoading = queryEnabled && isQueryLoading;

  return {
    balance: formattedBalance,
    rawBalance: balance,
    isLoading,
    error,
    refetch,
    decimals,
  };
}
