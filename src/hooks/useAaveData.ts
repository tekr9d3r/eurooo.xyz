import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useDefiLlamaData } from './useDefiLlamaData';
import {
  AAVE_AEURC_ADDRESSES,
  ERC20_ABI,
} from '@/lib/contracts';

export function useAaveData() {
  const { address } = useAccount();
  
  // Get APY and TVL from DefiLlama (single cached API call)
  const { aaveEthereum, aaveBase, aaveGnosis, isLoading: isLoadingDefiLlama, refetch: refetchDefiLlama } = useDefiLlamaData();

  // Get user's aEURC balance on Ethereum
  const ethereumAEurcAddress = AAVE_AEURC_ADDRESSES[1];
  const { data: ethereumUserBalance, refetch: refetchEthereumBalance } = useReadContract({
    address: ethereumAEurcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 1,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Get user's aEURC balance on Base
  const baseAEurcAddress = AAVE_AEURC_ADDRESSES[8453];
  const { data: baseUserBalance, refetch: refetchBaseBalance } = useReadContract({
    address: baseAEurcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 8453,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Get user's aEURe balance on Gnosis
  const gnosisAEurcAddress = AAVE_AEURC_ADDRESSES[100];
  const { data: gnosisUserBalance, refetch: refetchGnosisBalance } = useReadContract({
    address: gnosisAEurcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 100,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Format user deposits (6 decimals for EURC, 18 for EURe on Gnosis)
  const ethereumUserDeposit = ethereumUserBalance ? Number(formatUnits(ethereumUserBalance, 6)) : 0;
  const baseUserDeposit = baseUserBalance ? Number(formatUnits(baseUserBalance, 6)) : 0;
  const gnosisUserDeposit = gnosisUserBalance ? Number(formatUnits(gnosisUserBalance, 18)) : 0;

  const refetch = () => {
    refetchDefiLlama();
    refetchEthereumBalance();
    refetchBaseBalance();
    refetchGnosisBalance();
  };

  return {
    ethereumData: { apy: aaveEthereum.apy, tvl: aaveEthereum.tvl },
    baseData: { apy: aaveBase.apy, tvl: aaveBase.tvl },
    gnosisData: { apy: aaveGnosis.apy, tvl: aaveGnosis.tvl },
    ethereumUserDeposit,
    baseUserDeposit,
    gnosisUserDeposit,
    isLoading: isLoadingDefiLlama,
    refetch,
  };
}
