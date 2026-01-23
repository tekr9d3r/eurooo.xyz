import { useReadContract, useChainId, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  MORPHO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export type MorphoVaultId = 'morpho-gauntlet' | 'morpho-prime';

export function useMorphoData(vaultId: MorphoVaultId) {
  const chainId = useChainId();
  const { address } = useAccount();
  
  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = chainId === 1 ? vaultConfig?.[1] : undefined;
  const isSupported = chainId === 1 && !!vaultAddress;

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

  // Get total supply of vault shares (unused for now, kept for potential future use)
  const { refetch: refetchTotalSupply } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: isSupported,
      refetchInterval: 60000,
    },
  });

  // APY estimates based on current rates from Morpho app
  // Gauntlet EURC Core: ~4.38% APY
  // EURCV Prime: ~5.71% APY
  const estimatedApy = vaultId === 'morpho-gauntlet' ? 4.38 : 5.71;
  
  // EURC has 6 decimals, EURCV has 18 decimals
  const decimals = vaultId === 'morpho-gauntlet' ? 6 : 18;

  // Format values
  const tvl = totalAssets ? Number(formatUnits(totalAssets, decimals)) : 0;
  const userDeposit = userAssets ? Number(formatUnits(userAssets, decimals)) : 0;

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
