import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import { ETHERFI_WEUR_ADDRESSES, ERC4626_VAULT_ABI, ERC20_ABI } from '@/lib/contracts';

const ETHERFI_CHAIN_ID = 10; // Optimism

export function useEtherFiData() {
  const config = useConfig();
  const { address } = useAccount();
  const isReady = !!config;

  const vaultAddress = ETHERFI_WEUR_ADDRESSES[10];
  const { etherfiOptimism, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // Read user's weEUR share balance
  const { data: userShares, isLoading: isLoadingShares, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ETHERFI_CHAIN_ID,
    query: {
      enabled: isReady && !!address,
      refetchInterval: 30000,
    },
  });

  // Convert weEUR shares → EURC assets (ERC-4626)
  const { data: userAssets, isLoading: isLoadingAssets, refetch: refetchAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: ETHERFI_CHAIN_ID,
    query: {
      enabled: isReady && !!userShares && (userShares as bigint) > 0n,
      refetchInterval: 30000,
    },
  });

  // EURC has 6 decimals
  const userDeposit = userAssets ? Number(formatUnits(userAssets as bigint, 6)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    if (isReady) {
      refetchShares();
      refetchAssets();
    }
  };

  return {
    apy: etherfiOptimism.apy,
    tvl: etherfiOptimism.tvl,
    userDeposit,
    isLoading: isLoadingDefiLlama || isLoadingShares || isLoadingAssets,
    refetch,
  };
}
