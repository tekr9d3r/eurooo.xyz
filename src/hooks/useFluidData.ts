import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { readContractMultichain } from '@/lib/viemClients';
import {
  FLUID_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

const FLUID_CHAIN_ID = 8453; // Base

// Maximum reasonable TVL (1 billion EUR) - anything higher is clearly an error
const MAX_REASONABLE_TVL = 1_000_000_000;

// Fetch TVL from Base using public client (no wallet required)
async function fetchFluidTVL(vaultAddress: `0x${string}`) {
  try {
    const totalAssets = await readContractMultichain<bigint>(FLUID_CHAIN_ID, {
      address: vaultAddress,
      abi: ERC4626_VAULT_ABI,
      functionName: 'totalAssets',
    });

    const tvl = Number(formatUnits(totalAssets, 6)); // EURC has 6 decimals
    
    // Sanity check: if TVL is unrealistically high, it's likely a decimal error
    if (tvl > MAX_REASONABLE_TVL || !Number.isFinite(tvl) || tvl < 0) {
      console.warn('[Fluid] TVL value seems incorrect, returning null:', tvl);
      return null; // Return null to indicate invalid data
    }
    
    return tvl;
  } catch (error) {
    console.error('[Fluid] Error fetching TVL:', error);
    return null;
  }
}

export function useFluidData() {
  const { address } = useAccount();
  
  const vaultAddress = FLUID_VAULT_ADDRESSES[8453];

  // Fetch TVL regardless of connected chain
  // keepPreviousData prevents showing 0 or null when refetch returns invalid data
  const { data: tvl, isLoading: isLoadingTVL, refetch: refetchTVL } = useQuery({
    queryKey: ['fluid-tvl'],
    queryFn: () => fetchFluidTVL(vaultAddress),
    enabled: !!vaultAddress,
    refetchInterval: 60000,
    staleTime: 30000,
    // Don't replace valid data with null on refetch errors
    placeholderData: (previousData) => previousData,
  });

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

  // Fluid EURC APY: ~5.01% (from their website)
  const estimatedApy = 5.01;

  // Format user deposit (EURC has 6 decimals)
  const userDeposit = userAssets ? Number(formatUnits(userAssets, 6)) : 0;

  const refetch = () => {
    refetchTVL();
    refetchUserShares();
    refetchUserAssets();
  };

  return {
    apy: estimatedApy,
    tvl: tvl ?? 0,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported: true,
    isLoading: isLoadingTVL || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
