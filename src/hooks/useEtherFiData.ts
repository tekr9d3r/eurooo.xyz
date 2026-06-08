import { useReadContract, useAccount, useConfig } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import { ETHERFI_WEUR_ADDRESSES, ERC20_ABI } from '@/lib/contracts';

const ETHERFI_CHAIN_ID = 10; // Optimism

export function useEtherFiData() {
  const config = useConfig();
  const { address } = useAccount();
  const isReady = !!config;

  const vaultAddress = ETHERFI_WEUR_ADDRESSES[10];
  const { etherfiOptimism, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // weEUR is a BoringVault receipt token (18 decimals, ~1:1 with EURC)
  // convertToAssets reverts on this contract, so we use balanceOf directly
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

  const userDeposit = userShares ? Number(formatUnits(userShares as bigint, 18)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    if (isReady) {
      refetchShares();
    }
  };

  return {
    apy: etherfiOptimism.apy,
    tvl: etherfiOptimism.tvl,
    userDeposit,
    isLoading: isLoadingDefiLlama || isLoadingShares,
    refetch,
  };
}
