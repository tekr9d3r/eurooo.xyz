import { useAaveData } from './useAaveData';
import { useSummerData } from './useSummerData';
import { useYoData } from './useYoData';
import { useMorphoData } from './useMorphoData';
import { useFluidData } from './useFluidData';
import { useEURCBalance } from './useEURCBalance';
import aaveLogo from '@/assets/aave-logo.png';
import fluidLogo from '@/assets/fluid-logo.png';

export interface ProtocolData {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: number;
  tvlFormatted: string;
  chains: string[];
  color: 'aave' | 'summer' | 'yo' | 'morpho' | 'fluid';
  chainId: number; // Required chain ID for protocol-specific actions
  userDeposit: number;
  isLoading: boolean;
  isSupported: boolean;
  stablecoin: 'EURC' | 'EURe' | 'EURC/EURe';
  logo?: string;
  learnMoreUrl?: string;
  safetyScore?: number;
  safetyProvider?: string;
  safetyReportUrl?: string;
  // Grouped protocol fields
  isGrouped?: boolean;
  subProtocols?: ProtocolData[];
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
  const fluidData = useFluidData();

  // Individual Aave chain entries (used as sub-protocols)
  const aaveEthereum: ProtocolData = {
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
    logo: aaveLogo,
    learnMoreUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x1abaea1f7c830bd89acc67ec4af516284b1bc33c&marketName=proto_mainnet_v3',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
  };

  const aaveBase: ProtocolData = {
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
    logo: aaveLogo,
    learnMoreUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42&marketName=proto_base_v3',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
  };

  const aaveGnosis: ProtocolData = {
    id: 'aave-gnosis',
    name: 'Aave',
    description: 'Leading lending protocol',
    apy: aaveData.gnosisData.apy,
    tvl: aaveData.gnosisData.tvl,
    tvlFormatted: formatTVL(aaveData.gnosisData.tvl),
    chains: ['Gnosis'],
    chainId: 100,
    color: 'aave',
    userDeposit: aaveData.gnosisUserDeposit,
    isLoading: aaveData.isLoading,
    isSupported: true,
    stablecoin: 'EURe',
    logo: aaveLogo,
    learnMoreUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xcb444e90d8198415266c6a2724b7900fb12fc56e&marketName=proto_gnosis_v3',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
  };

  // Calculate aggregated Aave metrics
  const aaveSubProtocols = [aaveEthereum, aaveBase, aaveGnosis];
  const aaveTotalTvl = aaveSubProtocols.reduce((sum, p) => sum + p.tvl, 0);
  const aaveTotalDeposit = aaveSubProtocols.reduce((sum, p) => sum + p.userDeposit, 0);
  
  // TVL-weighted average APY
  const aaveWeightedApy = aaveTotalTvl > 0
    ? aaveSubProtocols.reduce((sum, p) => sum + (p.apy * p.tvl), 0) / aaveTotalTvl
    : 0;

  // Aggregated Aave entry
  const aaveGrouped: ProtocolData = {
    id: 'aave',
    name: 'Aave',
    description: 'Leading lending protocol',
    apy: aaveWeightedApy,
    tvl: aaveTotalTvl,
    tvlFormatted: formatTVL(aaveTotalTvl),
    chains: ['Ethereum', 'Base', 'Gnosis'],
    chainId: 1, // Default to Ethereum for the group
    color: 'aave',
    userDeposit: aaveTotalDeposit,
    isLoading: aaveData.isLoading,
    isSupported: true,
    stablecoin: 'EURC/EURe',
    logo: aaveLogo,
    learnMoreUrl: 'https://aave.com',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
    isGrouped: true,
    subProtocols: aaveSubProtocols,
  };

  // Real data from all protocols
  const protocols: ProtocolData[] = [
    aaveGrouped,
    {
      id: 'summer',
      name: 'Summer.fi',
      description: 'Lazy yield vault',
      apy: summerData.apy,
      tvl: summerData.tvl,
      tvlFormatted: summerData.tvl > 0 ? formatTVL(summerData.tvl) : '—',
      chains: ['Base'],
      chainId: 8453,
      color: 'summer',
      userDeposit: summerData.userDeposit,
      isLoading: summerData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
      learnMoreUrl: 'https://summer.fi/earn/base/position/0x64db8f51f1bf7064bb5a361a7265f602d348e0f0',
      safetyScore: 71,
      safetyProvider: 'DeFiSafety',
      safetyReportUrl: 'https://defisafety.com/app/pqrs/578',
    },
    {
      id: 'yo',
      name: 'YO Protocol',
      description: 'Multi-chain yield optimizer',
      apy: yoData.apy,
      tvl: yoData.tvl,
      tvlFormatted: yoData.tvl > 0 ? formatTVL(yoData.tvl) : '—',
      chains: ['Base'],
      chainId: 8453,
      color: 'yo',
      userDeposit: yoData.userDeposit,
      isLoading: yoData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
      learnMoreUrl: 'https://app.yo.xyz/vault/base/0x50c749aE210D3977ADC824AE11F3c7fd10c871e9',
      // YO Protocol not yet rated by DeFiSafety
    },
    {
      id: 'morpho-gauntlet',
      name: 'Gauntlet EURC Core',
      description: 'Morpho vault by Gauntlet',
      apy: morphoGauntletData.apy,
      tvl: morphoGauntletData.tvl,
      tvlFormatted: morphoGauntletData.tvl > 0 ? formatTVL(morphoGauntletData.tvl) : '—',
      chains: ['Ethereum'],
      chainId: 1,
      color: 'morpho',
      userDeposit: morphoGauntletData.userDeposit,
      isLoading: morphoGauntletData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
      learnMoreUrl: 'https://app.morpho.org/ethereum/vault/0x2ed10624315b74a78f11FAbedAa1A228c198aEfB/gauntlet-eurc-core',
      safetyScore: 93,
      safetyProvider: 'DeFiSafety',
      safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
    },
    {
      id: 'fluid',
      name: 'Fluid',
      description: 'Lending protocol by Instadapp',
      apy: fluidData.apy,
      tvl: fluidData.tvl,
      tvlFormatted: fluidData.tvl > 0 ? formatTVL(fluidData.tvl) : '—',
      chains: ['Base'],
      chainId: 8453,
      color: 'fluid',
      userDeposit: fluidData.userDeposit,
      isLoading: fluidData.isLoading,
      isSupported: true,
      stablecoin: 'EURC',
      logo: fluidLogo,
      learnMoreUrl: 'https://fluid.io/lending/8453/EURC',
      // Fluid not yet rated by DeFiSafety
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
    fluidData.refetch();
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
