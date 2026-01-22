import { useReadContract, useChainId, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  EURC_ADDRESSES,
  AAVE_V3_POOL_DATA_PROVIDER,
  AAVE_AEURC_ADDRESSES,
  AAVE_POOL_DATA_PROVIDER_ABI,
  ERC20_ABI,
  liquidityRateToAPY,
} from '@/lib/contracts';

export function useAaveData() {
  const chainId = useChainId();
  const { address } = useAccount();
  
  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const poolDataProvider = AAVE_V3_POOL_DATA_PROVIDER[chainId as keyof typeof AAVE_V3_POOL_DATA_PROVIDER];
  const aEurcAddress = AAVE_AEURC_ADDRESSES[chainId as keyof typeof AAVE_AEURC_ADDRESSES];

  // Get reserve data (includes liquidity rate for APY)
  const { data: reserveData, isLoading: isLoadingReserve, refetch: refetchReserve } = useReadContract({
    address: poolDataProvider,
    abi: AAVE_POOL_DATA_PROVIDER_ABI,
    functionName: 'getReserveData',
    args: eurcAddress ? [eurcAddress] : undefined,
    query: {
      enabled: !!eurcAddress && !!poolDataProvider,
      refetchInterval: 60000, // Refetch every minute
    },
  });

  // Get user's aEURC balance (represents their deposit in Aave)
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

  // Get total aEURC supply (TVL proxy)
  const { data: totalATokenSupply, isLoading: isLoadingTVL, refetch: refetchTVL } = useReadContract({
    address: aEurcAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    args: [],
    query: {
      enabled: !!aEurcAddress,
      refetchInterval: 60000,
    },
  });

  // Calculate APY from liquidity rate
  const liquidityRate = reserveData?.[5]; // Index 5 is liquidityRate
  const apy = liquidityRate ? liquidityRateToAPY(liquidityRate) : 0;

  // Format user deposit (6 decimals for EURC)
  const userDeposit = userATokenBalance ? Number(formatUnits(userATokenBalance, 6)) : 0;

  // Format TVL
  const tvl = totalATokenSupply ? Number(formatUnits(totalATokenSupply, 6)) : 0;

  const refetch = () => {
    refetchReserve();
    refetchBalance();
    refetchTVL();
  };

  return {
    apy,
    userDeposit,
    tvl,
    isLoading: isLoadingReserve || isLoadingUserBalance || isLoadingTVL,
    refetch,
  };
}
