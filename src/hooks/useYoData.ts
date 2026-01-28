import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  YO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

const YO_CHAIN_ID = 8453; // Base only
const vaultAddress = YO_VAULT_ADDRESSES[YO_CHAIN_ID];

export function useYoData() {
  const config = useConfig();
  const { address } = useAccount();
  
  // Safety check - if wagmi config isn't ready, return defaults
  const isReady = !!config;

  // Get APY and TVL from DefiLlama
  const { yoBase, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // Get user's vault shares balance (always fetch from Base regardless of connected chain)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: YO_CHAIN_ID,
    query: {
      enabled: isReady && !!address,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets (always fetch from Base regardless of connected chain)
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: YO_CHAIN_ID,
    query: {
      enabled: isReady && !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // Format user deposit (EURC has 6 decimals)
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    if (isReady) {
      refetchUserShares();
      refetchUserAssets();
    }
  };

  return {
    apy: yoBase.apy,
    tvl: yoBase.tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported: true,
    isLoading: isLoadingDefiLlama || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
