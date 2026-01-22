import { useReadContract, useChainId, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  YO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export function useYoData() {
  const chainId = useChainId();
  const { address } = useAccount();
  
  const vaultAddress = YO_VAULT_ADDRESSES[chainId as keyof typeof YO_VAULT_ADDRESSES];
  const isSupported = !!vaultAddress;

  // Get total assets (TVL) - this is the total EURC in the vault
  const { data: totalAssets, isLoading: isLoadingTVL, refetch: refetchTVL, error: tvlError } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'totalAssets',
    query: {
      enabled: isSupported,
      refetchInterval: 60000,
    },
  });

  // Get user's vault shares balance (yoEUR tokens)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isSupported && !!address,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: {
      enabled: isSupported && !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // YO Protocol shows ~7% APY on their homepage for yoEUR
  const estimatedApy = 5.2;

  // Debug logging
  console.log('[YO Data]', {
    chainId,
    vaultAddress,
    isSupported,
    totalAssets: totalAssets?.toString(),
    tvlError: tvlError?.message,
    userShares: userShares?.toString(),
    userAssets: userAssets?.toString(),
    isLoadingTVL,
  });

  // Format values (EURC has 6 decimals)
  const tvl = totalAssets ? Number(formatUnits(totalAssets, 6)) : 0;
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchTVL();
    refetchUserShares();
    refetchUserAssets();
  };

  return {
    apy: isSupported ? estimatedApy : 0, // Only show APY if on supported chain
    tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported,
    isLoading: isLoadingTVL || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
