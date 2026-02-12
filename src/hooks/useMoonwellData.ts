import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  MOONWELL_MTOKEN_ADDRESSES,
  MOONWELL_MTOKEN_ABI,
} from '@/lib/contracts';

const MOONWELL_CHAIN_ID = 8453; // Base

export function useMoonwellData() {
  const config = useConfig();
  const { address } = useAccount();
  
  const isReady = !!config;
  const mTokenAddress = MOONWELL_MTOKEN_ADDRESSES[8453];

  const { moonwellBase, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // Get user's underlying balance via balanceOfUnderlying
  const { data: userUnderlyingBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: mTokenAddress,
    abi: MOONWELL_MTOKEN_ABI,
    functionName: 'balanceOfUnderlying',
    args: address ? [address] : undefined,
    chainId: MOONWELL_CHAIN_ID,
    query: {
      enabled: isReady && !!address,
      refetchInterval: 30000,
    },
  });

  // Get user's mToken balance (for withdrawals)
  const { data: userMTokenBalance, refetch: refetchMTokenBalance } = useReadContract({
    address: mTokenAddress,
    abi: MOONWELL_MTOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: MOONWELL_CHAIN_ID,
    query: {
      enabled: isReady && !!address,
      refetchInterval: 30000,
    },
  });

  // Format user deposit (EURC has 6 decimals)
  const userDeposit = userUnderlyingBalance ? Number(formatUnits(userUnderlyingBalance as bigint, 6)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    if (isReady) {
      refetchBalance();
      refetchMTokenBalance();
    }
  };

  return {
    apy: moonwellBase.apy,
    tvl: moonwellBase.tvl,
    userDeposit,
    userMTokenBalance: userMTokenBalance || 0n,
    mTokenAddress,
    isSupported: true,
    isLoading: isLoadingDefiLlama,
    refetch,
  };
}
