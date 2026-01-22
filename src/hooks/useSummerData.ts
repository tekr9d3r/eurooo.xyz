import { useReadContract, useChainId, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  SUMMER_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export function useSummerData() {
  const chainId = useChainId();
  const { address } = useAccount();
  
  const vaultAddress = SUMMER_VAULT_ADDRESSES[chainId as keyof typeof SUMMER_VAULT_ADDRESSES];
  const isSupported = !!vaultAddress;

  // Get total assets (TVL)
  const { data: totalAssets, isLoading: isLoadingTVL, refetch: refetchTVL } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'totalAssets',
    query: {
      enabled: isSupported,
      refetchInterval: 60000,
    },
  });

  // Get user's vault shares balance
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

  // Get total supply of vault shares
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: isSupported,
      refetchInterval: 60000,
    },
  });

  // Calculate APY (approximate based on asset growth)
  // For Summer.fi, we estimate APY based on their typical range (2-5%)
  // In production, you'd fetch this from their API
  const estimatedApy = 3.5; // Summer.fi typically offers 3-5% on stablecoins

  // Format values (EURC has 6 decimals)
  const tvl = totalAssets ? Number(formatUnits(totalAssets, 6)) : 0;
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchTVL();
    refetchUserShares();
    refetchUserAssets();
    refetchTotalSupply();
  };

  return {
    apy: estimatedApy,
    tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported,
    isLoading: isLoadingTVL || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
