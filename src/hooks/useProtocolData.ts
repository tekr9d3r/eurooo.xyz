import { useAaveData } from './useAaveData';
import { useEURCBalance } from './useEURCBalance';

export interface ProtocolData {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: number;
  tvlFormatted: string;
  chains: string[];
  color: 'aave' | 'summer' | 'yo';
  userDeposit: number;
  isLoading: boolean;
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
  const { balance: eurcBalance, isLoading: isLoadingEurc } = useEURCBalance();
  const aaveData = useAaveData();

  // Real data from Aave
  const protocols: ProtocolData[] = [
    {
      id: 'aave',
      name: 'Aave',
      description: 'Leading lending protocol',
      apy: aaveData.apy,
      tvl: aaveData.tvl,
      tvlFormatted: formatTVL(aaveData.tvl),
      chains: ['Ethereum', 'Base'],
      color: 'aave',
      userDeposit: aaveData.userDeposit,
      isLoading: aaveData.isLoading,
    },
    {
      id: 'summer',
      name: 'Summer.fi',
      description: 'DeFi management platform',
      // Summer.fi doesn't have direct on-chain APY reads easily available
      // In production, you'd fetch from their API or smart contracts
      apy: 0, // Will show as "Loading..." or use fallback
      tvl: 0,
      tvlFormatted: '—',
      chains: ['Ethereum'],
      color: 'summer',
      userDeposit: 0,
      isLoading: false,
    },
    {
      id: 'yo',
      name: 'Yo.xyz',
      description: 'Yield optimizer for staking',
      // Yo.xyz would need their specific contract integration
      apy: 0,
      tvl: 0,
      tvlFormatted: '—',
      chains: ['Ethereum', 'Base'],
      color: 'yo',
      userDeposit: 0,
      isLoading: false,
    },
  ];

  const totalDeposits = protocols.reduce((sum, p) => sum + p.userDeposit, 0);
  
  // Weighted average APY based on deposits
  const weightedApy = totalDeposits > 0
    ? protocols.reduce((sum, p) => sum + (p.apy * p.userDeposit), 0) / totalDeposits
    : protocols.find(p => p.apy > 0)?.apy || 0;

  return {
    protocols,
    eurcBalance,
    totalDeposits,
    averageApy: weightedApy,
    isLoading: isLoadingEurc || protocols.some(p => p.isLoading),
  };
}
