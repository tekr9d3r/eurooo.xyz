import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { readContractMultichain } from '@/lib/viemClients';
import {
  SUMMER_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

const SUMMER_CHAIN_ID = 8453; // Base only
const vaultAddress = SUMMER_VAULT_ADDRESSES[SUMMER_CHAIN_ID];

// Fetch TVL from Base using public client (no wallet required)
async function fetchSummerTVL() {
  try {
    const totalAssets = await readContractMultichain<bigint>(SUMMER_CHAIN_ID, {
      address: vaultAddress,
      abi: ERC4626_VAULT_ABI,
      functionName: 'totalAssets',
    });

    return Number(formatUnits(totalAssets, 6));
  } catch (error) {
    console.error('[Summer] Error fetching TVL:', error);
    return 0;
  }
}

export function useSummerData() {
  const { address } = useAccount();

  // Fetch TVL regardless of connected chain
  const { data: tvl, isLoading: isLoadingTVL, refetch: refetchTVL } = useQuery({
    queryKey: ['summer-tvl'],
    queryFn: fetchSummerTVL,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Get user's vault shares balance (always fetch from Base regardless of connected chain)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SUMMER_CHAIN_ID,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets (always fetch from Base regardless of connected chain)
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: SUMMER_CHAIN_ID,
    query: {
      enabled: !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // Summer.fi typically offers 3-5% on stablecoins
  const estimatedApy = 3.5;

  // Format user deposit (EURC has 6 decimals)
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchTVL();
    refetchUserShares();
    refetchUserAssets();
  };

  return {
    apy: estimatedApy,
    tvl: tvl || 0,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported: true, // Always supported now since we fetch from Base directly
    isLoading: isLoadingTVL || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
