import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  FLUID_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

const FLUID_CHAIN_ID = 8453; // Base

export function useFluidData() {
  const { address } = useAccount();
  
  const vaultAddress = FLUID_VAULT_ADDRESSES[8453];

  // Get APY and TVL from DefiLlama
  const { fluidBase, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // Get user's vault shares balance (fEURC token)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: FLUID_CHAIN_ID,
    query: {
      enabled: !!address && !!vaultAddress,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: FLUID_CHAIN_ID,
    query: {
      enabled: !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // Format user deposit (EURC has 6 decimals)
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    refetchUserShares();
    refetchUserAssets();
  };

  return {
    apy: fluidBase.apy,
    tvl: fluidBase.tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported: true,
    isLoading: isLoadingDefiLlama || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
