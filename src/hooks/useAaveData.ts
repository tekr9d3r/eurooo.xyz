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

// Fetch APY and TVL from a specific chain using public client
async function fetchAaveChainData(chainId: 1 | 8453) {
  const eurcAddress = EURC_ADDRESSES[chainId];
  const poolDataProvider = AAVE_V3_POOL_DATA_PROVIDER[chainId];
  const aEurcAddress = AAVE_AEURC_ADDRESSES[chainId];

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
    const tvl = Number(formatUnits(totalSupply, 6));

    return { apy, tvl };
  } catch (error) {
    console.error(`[Aave] Error fetching data for chain ${chainId}:`, error);
    return { apy: 0, tvl: 0 };
  }
}

export function useAaveData() {
  const connectedChainId = useChainId();
  const { address } = useAccount();

  // Fetch data from both chains simultaneously
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

  // Get user's aEURC balance on the connected chain (wallet-dependent)
  const aEurcAddress = AAVE_AEURC_ADDRESSES[connectedChainId as keyof typeof AAVE_AEURC_ADDRESSES];
  
  const { data: userATokenBalance, isLoading: isLoadingUserBalance, refetch: refetchBalance } = useReadContract({
    address: aEurcAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!aEurcAddress,
      refetchInterval: 30000,
    },
  });

  // Combine APY - use weighted average if both chains have data
  const ethApy = ethereumData?.apy || 0;
  const baseApy = baseData?.apy || 0;
  const ethTvl = ethereumData?.tvl || 0;
  const baseTvl = baseData?.tvl || 0;

  // Combined TVL from both chains
  const totalTvl = ethTvl + baseTvl;

  // Weighted average APY based on TVL
  const combinedApy = totalTvl > 0
    ? (ethApy * ethTvl + baseApy * baseTvl) / totalTvl
    : (ethApy + baseApy) / 2;

  // Format user deposit (6 decimals for EURC)
  const userDeposit = userATokenBalance ? Number(formatUnits(userATokenBalance, 6)) : 0;

  const refetch = () => {
    refetchEthereum();
    refetchBase();
    refetchBalance();
  };

  return {
    apy: combinedApy,
    tvl: totalTvl,
    userDeposit,
    ethereumData: { apy: ethApy, tvl: ethTvl },
    baseData: { apy: baseApy, tvl: baseTvl },
    isLoading: isLoadingEthereum || isLoadingBase || isLoadingUserBalance,
    refetch,
  };
}
