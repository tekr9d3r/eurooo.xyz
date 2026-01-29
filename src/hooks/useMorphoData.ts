import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  MORPHO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

export type MorphoVaultId = 
  | 'morpho-gauntlet' 
  | 'morpho-prime' 
  | 'morpho-kpk'
  | 'morpho-moonwell'
  | 'morpho-steakhouse'
  | 'morpho-steakhouse-prime';

// Map vault IDs to their chain
const VAULT_CHAIN_IDS: Record<MorphoVaultId, 1 | 8453> = {
  'morpho-gauntlet': 1,
  'morpho-prime': 1,
  'morpho-kpk': 1,
  'morpho-moonwell': 8453,
  'morpho-steakhouse': 8453,
  'morpho-steakhouse-prime': 8453,
};

export function useMorphoData(vaultId: MorphoVaultId) {
  const config = useConfig();
  const { address } = useAccount();
  
  // Safety check - if wagmi config isn't ready, return defaults
  const isReady = !!config;
  
  const vaultChainId = VAULT_CHAIN_IDS[vaultId];
  
  // Get APY and TVL from DefiLlama
  const { 
    morphoGauntlet, morphoPrime, morphoKpk,
    morphoMoonwell, morphoSteakhouse, morphoSteakhousePrime,
    isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama 
  } = useDefiLlamaData();
  
  // Map vault ID to DefiLlama data
  const defiLlamaData: Record<MorphoVaultId, { apy: number; tvl: number }> = {
    'morpho-gauntlet': morphoGauntlet,
    'morpho-prime': morphoPrime,
    'morpho-kpk': morphoKpk,
    'morpho-moonwell': morphoMoonwell,
    'morpho-steakhouse': morphoSteakhouse,
    'morpho-steakhouse-prime': morphoSteakhousePrime,
  };

  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = vaultConfig?.[vaultChainId as keyof typeof vaultConfig] as `0x${string}` | undefined;

  const sharesQueryEnabled = isReady && !!address && !!vaultAddress;

  // Get user's vault shares balance (always fetch from the vault's chain)
  const { data: userShares, isLoading: isLoadingUserShares, refetch: refetchUserShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: vaultChainId,
    query: {
      enabled: sharesQueryEnabled,
      refetchInterval: 30000,
    },
  });

  const assetsQueryEnabled = isReady && !!userShares && userShares > 0n;

  // Convert user shares to assets
  const { data: userAssets, isLoading: isLoadingUserAssets, refetch: refetchUserAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: vaultChainId,
    query: {
      enabled: assetsQueryEnabled,
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
    apy: defiLlamaData[vaultId].apy,
    tvl: defiLlamaData[vaultId].tvl,
    userDeposit,
    userShares: userShares || 0n,
    vaultAddress,
    chainId: vaultChainId,
    isSupported: true,
    isLoading: isLoadingDefiLlama,
    refetch,
  };
}
