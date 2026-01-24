import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { readContractMultichain } from '@/lib/viemClients';
import {
  YO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

const YO_CHAIN_ID = 8453; // Base only
const vaultAddress = YO_VAULT_ADDRESSES[YO_CHAIN_ID];

// Fetch TVL from Base using public client (no wallet required)
async function fetchYoTVL() {
  try {
    const totalAssets = await readContractMultichain<bigint>(YO_CHAIN_ID, {
      address: vaultAddress,
      abi: ERC4626_VAULT_ABI,
      functionName: 'totalAssets',
    });

    return Number(formatUnits(totalAssets, 6));
  } catch (error) {
    console.error('[YO] Error fetching TVL:', error);
    return 0;
  }
}

export function useYoData() {
  const connectedChainId = useChainId();
  const { address } = useAccount();
  
  const isOnSupportedChain = connectedChainId === YO_CHAIN_ID;

  // Fetch TVL regardless of connected chain
  const { data: tvl, isLoading: isLoadingTVL, refetch: refetchTVL } = useQuery({
    queryKey: ['yo-tvl'],
    queryFn: fetchYoTVL,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Get user's vault shares balance (only when on Base)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isOnSupportedChain && !!address,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets (only when on Base)
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: {
      enabled: isOnSupportedChain && !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // YO Protocol shows ~5.2% APY for yoEUR
  const estimatedApy = 5.2;

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
