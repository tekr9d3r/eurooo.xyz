import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { readContractMultichain } from '@/lib/viemClients';
import {
  MORPHO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export type MorphoVaultId = 'morpho-gauntlet' | 'morpho-prime' | 'morpho-kpk';

// Estimated APYs for each vault (these would ideally come from an API)
const MORPHO_APYS: Record<MorphoVaultId, number> = {
  'morpho-gauntlet': 4.38,
  'morpho-prime': 3.85,
  'morpho-kpk': 4.12,
};

const MORPHO_CHAIN_ID = 1; // Ethereum only

// Fetch TVL from Ethereum using public client (no wallet required)
async function fetchMorphoTVL(vaultAddress: `0x${string}`) {
  try {
    const totalAssets = await readContractMultichain<bigint>(MORPHO_CHAIN_ID, {
      address: vaultAddress,
      abi: ERC4626_VAULT_ABI,
      functionName: 'totalAssets',
    });

    return Number(formatUnits(totalAssets, 6));
  } catch (error) {
    console.error('[Morpho] Error fetching TVL:', error);
    return 0;
  }
}

export function useMorphoData(vaultId: MorphoVaultId) {
  const { address } = useAccount();
  
  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = vaultConfig?.[1]; // Chain 1 address

  // Fetch TVL regardless of connected chain
  const { data: tvl, isLoading: isLoadingTVL, refetch: refetchTVL } = useQuery({
    queryKey: ['morpho-tvl', vaultId],
    queryFn: () => fetchMorphoTVL(vaultAddress!),
    enabled: !!vaultAddress,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Get user's vault shares balance (always fetch from Ethereum regardless of connected chain)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: MORPHO_CHAIN_ID,
    query: {
      enabled: !!address && !!vaultAddress,
      refetchInterval: 30000,
    },
  });

  // Convert user shares to assets (always fetch from Ethereum regardless of connected chain)
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: MORPHO_CHAIN_ID,
    query: {
      enabled: !!userShares && userShares > 0n,
      refetchInterval: 30000,
    },
  });

  // Get APY for this vault
  const estimatedApy = MORPHO_APYS[vaultId];

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
    isSupported: true, // Always supported now since we fetch from Ethereum directly
    isLoading: isLoadingTVL || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
