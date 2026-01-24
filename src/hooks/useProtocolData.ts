import { useAaveData } from './useAaveData';
import { useSummerData } from './useSummerData';
import { useYoData } from './useYoData';
import { useMorphoData } from './useMorphoData';
import { useEURCBalance } from './useEURCBalance';

export interface ProtocolData {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: number;
  tvlFormatted: string;
  chains: string[];
  color: 'aave' | 'summer' | 'yo' | 'morpho';
  chainId?: number; // Chain ID for protocol-specific actions
  userDeposit: number;
  isLoading: boolean;
  isSupported: boolean;
  stablecoin: 'EURC';
  logo?: string;
}

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000) {
    return `€${(tvl / 1_000_000).toFixed(1)}M`;
  }
  if (tvl >= 1_000) {
    return `€${(tvl / 1_000).toFixed(1)}K`;
  }
  return `€${tvl.toFixed(0)}`;
}

export function useProtocolData() {
  const { balance: eurcBalance, isLoading: isLoadingEurc, refetch: refetchEurc } = useEURCBalance();
  const aaveData = useAaveData();
  const summerData = useSummerData();
  const yoData = useYoData();
  const morphoGauntletData = useMorphoData('morpho-gauntlet');

  // Real data from all protocols
  const protocols: ProtocolData[] = [
    {
      id: 'aave-ethereum',
      name: 'Aave',
      description: 'Leading lending protocol',
      apy: aaveData.ethereumData.apy,
      tvl: aaveData.ethereumData.tvl,
      tvlFormatted: formatTVL(aaveData.ethereumData.tvl),
      chains: ['Ethereum'],
      chainId: 1,
      color: 'aave',
      userDeposit: aaveData.ethereumUserDeposit,
      isLoading: aaveData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
    },
    {
      id: 'aave-base',
      name: 'Aave',
      description: 'Leading lending protocol',
      apy: aaveData.baseData.apy,
      tvl: aaveData.baseData.tvl,
      tvlFormatted: formatTVL(aaveData.baseData.tvl),
      chains: ['Base'],
      chainId: 8453,
      color: 'aave',
      userDeposit: aaveData.baseUserDeposit,
      isLoading: aaveData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
    },
    {
      id: 'summer',
      name: 'Summer.fi',
      description: 'Lazy yield vault',
      apy: summerData.apy,
      tvl: summerData.tvl,
      tvlFormatted: summerData.tvl > 0 ? formatTVL(summerData.tvl) : '—',
      chains: ['Base'],
      color: 'summer',
      userDeposit: summerData.userDeposit,
      isLoading: summerData.isLoading,
      isSupported: true, // Always supported - data fetched from Base
      stablecoin: 'EURC',
    },
    {
      id: 'yo',
      name: 'YO Protocol',
      description: 'Multi-chain yield optimizer',
      apy: yoData.apy,
      tvl: yoData.tvl,
      tvlFormatted: yoData.tvl > 0 ? formatTVL(yoData.tvl) : '—',
      chains: ['Base'],
      color: 'yo',
      userDeposit: yoData.userDeposit,
      isLoading: yoData.isLoading,
      isSupported: true, // Always supported - data fetched from Base
      stablecoin: 'EURC',
    },
    {
      id: 'morpho-gauntlet',
      name: 'Gauntlet EURC Core',
      description: 'Morpho vault by Gauntlet',
      apy: morphoGauntletData.apy,
      tvl: morphoGauntletData.tvl,
      tvlFormatted: morphoGauntletData.tvl > 0 ? formatTVL(morphoGauntletData.tvl) : '—',
      chains: ['Ethereum'],
      color: 'morpho',
      userDeposit: morphoGauntletData.userDeposit,
      isLoading: morphoGauntletData.isLoading,
      isSupported: true, // Always supported - data fetched from Ethereum
      stablecoin: 'EURC',
    },
  ];

  const totalDeposits = protocols.reduce((sum, p) => sum + p.userDeposit, 0);
  
  // Weighted average APY based on deposits
  const weightedApy = totalDeposits > 0
    ? protocols.reduce((sum, p) => sum + (p.apy * p.userDeposit), 0) / totalDeposits
    : protocols.find(p => p.apy > 0)?.apy || 0;

  const refetch = () => {
    refetchEurc();
    aaveData.refetch();
    summerData.refetch();
    yoData.refetch();
    morphoGauntletData.refetch();
  };

  return {
    protocols,
    eurcBalance,
    totalDeposits,
    averageApy: weightedApy,
    isLoading: isLoadingEurc || protocols.some(p => p.isLoading),
    refetch,
  };
}
