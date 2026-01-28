import { useAccount, useReadContract, useChainId, useConfig } from 'wagmi';
import { EURC_ADDRESSES, ERC20_ABI } from '@/lib/contracts';
import { formatUnits } from 'viem';

export function useEURCBalance() {
  const config = useConfig();
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Safety check - if wagmi config isn't ready, return defaults
  const isReady = !!config;
  
  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  
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

  // EURC has 6 decimals
  const formattedBalance = balance ? Number(formatUnits(balance, 6)) : 0;
  
  // isLoading should be false if the query is disabled (unsupported chain)
  const isLoading = queryEnabled && isQueryLoading;

  return {
    balance: formattedBalance,
    rawBalance: balance,
    isLoading,
    error,
    refetch,
  };
}
