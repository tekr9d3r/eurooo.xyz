import { useReadContract, useAccount, useChainId } from 'wagmi';
import { formatUnits } from 'viem';
import { useQuery } from '@tanstack/react-query';
import { readContractMultichain } from '@/lib/viemClients';
import {
  EURC_ADDRESSES,
  AAVE_V3_POOL_DATA_PROVIDER,
  AAVE_AEURC_ADDRESSES,
  AAVE_POOL_DATA_PROVIDER_ABI,
  ERC20_ABI,
  liquidityRateToAPY,
} from '@/lib/contracts';

// Decimals for each token (EURC = 6, EURe on Gnosis = 18)
const TOKEN_DECIMALS: Record<number, number> = {
  1: 6,     // EURC on Ethereum
  8453: 6,  // EURC on Base
  100: 18,  // EURe on Gnosis
};

// Fetch APY and TVL from a specific chain using public client
async function fetchAaveChainData(chainId: 1 | 8453 | 100) {
  const eurcAddress = EURC_ADDRESSES[chainId];
  const poolDataProvider = AAVE_V3_POOL_DATA_PROVIDER[chainId];
  const aEurcAddress = AAVE_AEURC_ADDRESSES[chainId];
  const decimals = TOKEN_DECIMALS[chainId];

  try {
    // Fetch reserve data for APY
    const reserveData = await readContractMultichain<readonly bigint[]>(chainId, {
      address: poolDataProvider,
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      functionName: 'getReserveData',
      args: [eurcAddress],
    });

    // Fetch total aToken supply for TVL
    const totalSupply = await readContractMultichain<bigint>(chainId, {
      address: aEurcAddress,
      abi: ERC20_ABI,
      functionName: 'totalSupply',
    });

    const liquidityRate = reserveData[5]; // Index 5 is liquidityRate
    const apy = liquidityRateToAPY(liquidityRate);
    const tvl = Number(formatUnits(totalSupply, decimals));

    return { apy, tvl };
  } catch (error) {
    console.error(`[Aave] Error fetching data for chain ${chainId}:`, error);
    return { apy: 0, tvl: 0 };
  }
}

export function useAaveData() {
  const { address } = useAccount();

  // Fetch data from all chains simultaneously
  const { data: ethereumData, isLoading: isLoadingEthereum, refetch: refetchEthereum } = useQuery({
    queryKey: ['aave-data', 1],
    queryFn: () => fetchAaveChainData(1),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: baseData, isLoading: isLoadingBase, refetch: refetchBase } = useQuery({
    queryKey: ['aave-data', 8453],
    queryFn: () => fetchAaveChainData(8453),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: gnosisData, isLoading: isLoadingGnosis, refetch: refetchGnosis } = useQuery({
    queryKey: ['aave-data', 100],
    queryFn: () => fetchAaveChainData(100),
    refetchInterval: 60000,
    staleTime: 30000,
  });

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

  const ethApy = ethereumData?.apy || 0;
  const baseApy = baseData?.apy || 0;
  const gnosisApy = gnosisData?.apy || 0;
  const ethTvl = ethereumData?.tvl || 0;
  const baseTvl = baseData?.tvl || 0;
  const gnosisTvl = gnosisData?.tvl || 0;

  // Format user deposits (6 decimals for EURC, 18 for EURe on Gnosis)
  const ethereumUserDeposit = ethereumUserBalance ? Number(formatUnits(ethereumUserBalance, 6)) : 0;
  const baseUserDeposit = baseUserBalance ? Number(formatUnits(baseUserBalance, 6)) : 0;
  const gnosisUserDeposit = gnosisUserBalance ? Number(formatUnits(gnosisUserBalance, 18)) : 0;

  const refetch = () => {
    refetchEthereum();
    refetchBase();
    refetchGnosis();
    refetchEthereumBalance();
    refetchBaseBalance();
    refetchGnosisBalance();
  };

  return {
    ethereumData: { apy: ethApy, tvl: ethTvl },
    baseData: { apy: baseApy, tvl: baseTvl },
    gnosisData: { apy: gnosisApy, tvl: gnosisTvl },
    ethereumUserDeposit,
    baseUserDeposit,
    gnosisUserDeposit,
    isLoading: isLoadingEthereum || isLoadingBase || isLoadingGnosis,
    refetch,
  };
}
