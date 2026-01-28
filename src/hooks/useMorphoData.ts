import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  MORPHO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export type MorphoVaultId = 'morpho-gauntlet' | 'morpho-prime' | 'morpho-kpk';

const MORPHO_CHAIN_ID = 1; // Ethereum only

export function useMorphoData(vaultId: MorphoVaultId) {
  const config = useConfig();
  const { address } = useAccount();
  
  // Safety check - if wagmi config isn't ready, return defaults
  const isReady = !!config;
  
  // Get APY and TVL from DefiLlama
  const { morphoGauntlet, morphoPrime, morphoKpk, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();
  
  // Map vault ID to DefiLlama data
  const defiLlamaData = {
    'morpho-gauntlet': morphoGauntlet,
    'morpho-prime': morphoPrime,
    'morpho-kpk': morphoKpk,
  }[vaultId];

  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = vaultConfig?.[1]; // Chain 1 address

  // Get user's vault shares balance (always fetch from Ethereum regardless of connected chain)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: MORPHO_CHAIN_ID,
    query: {
      enabled: isReady && !!address && !!vaultAddress,
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
    apy: defiLlamaData.apy,
    tvl: defiLlamaData.tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    isSupported: true,
    isLoading: isLoadingDefiLlama || isLoadingUserShares || isLoadingUserAssets,
    refetch,
  };
}
