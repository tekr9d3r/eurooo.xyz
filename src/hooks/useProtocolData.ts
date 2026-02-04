import { useAaveData } from './useAaveData';
import { useSummerData } from './useSummerData';
import { useYoData } from './useYoData';
import { useMorphoData } from './useMorphoData';
import { useFluidData } from './useFluidData';
import { useEURCBalance } from './useEURCBalance';
import aaveLogo from '@/assets/aave-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';
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
  stablecoin: 'EURC' | 'EURe' | 'EURCV' | 'EURC/EURe';
  logo?: string;
  learnMoreUrl?: string;
  safetyScore?: number;
  safetyProvider?: string;
  safetyReportUrl?: string;
  // For protocols with independent audits but no DeFiSafety score
  auditUrl?: string;
  auditProvider?: string;
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
  const morphoPrimeData = useMorphoData('morpho-prime');
  const morphoKpkData = useMorphoData('morpho-kpk');
  const morphoMoonwellData = useMorphoData('morpho-moonwell');
  const morphoSteakhouseData = useMorphoData('morpho-steakhouse');
  const morphoSteakhousePrimeData = useMorphoData('morpho-steakhouse-prime');
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

  const aaveAvalanche: ProtocolData = {
    id: 'aave-avalanche',
    name: 'Aave',
    description: 'Leading lending protocol',
    apy: aaveData.avalancheData.apy,
    tvl: aaveData.avalancheData.tvl,
    tvlFormatted: formatTVL(aaveData.avalancheData.tvl),
    chains: ['Avalanche'],
    chainId: 43114,
    color: 'aave',
    userDeposit: aaveData.avalancheUserDeposit,
    isLoading: aaveData.isLoading,
    isSupported: true,
    stablecoin: 'EURC',
    logo: aaveLogo,
    learnMoreUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xc891eb4cbdeff6e073e859e987815ed1505c2acd&marketName=proto_avalanche_v3',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
  };

  // Calculate aggregated Aave metrics
  const aaveSubProtocols = [aaveEthereum, aaveBase, aaveGnosis, aaveAvalanche];
  const aaveTotalTvl = aaveSubProtocols.reduce((sum, p) => sum + p.tvl, 0);
  const aaveTotalDeposit = aaveSubProtocols.reduce((sum, p) => sum + p.userDeposit, 0);
  
  // Highest APY among sub-protocols (for display in collapsed view)
  const aaveHighestApy = Math.max(...aaveSubProtocols.map(p => p.apy));

  // Aggregated Aave entry
  const aaveGrouped: ProtocolData = {
    id: 'aave',
    name: 'Aave',
    description: 'Leading lending protocol',
    apy: aaveHighestApy,
    tvl: aaveTotalTvl,
    tvlFormatted: formatTVL(aaveTotalTvl),
    chains: ['Ethereum', 'Base', 'Gnosis', 'Avalanche'],
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

  // Individual Morpho vault entries (used as sub-protocols)
  const morphoGauntlet: ProtocolData = {
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
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/ethereum/vault/0x2ed10624315b74a78f11FAbedAa1A228c198aEfB/gauntlet-eurc-core',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  const morphoPrime: ProtocolData = {
    id: 'morpho-prime',
    name: 'EURCV Prime',
    description: 'Morpho vault for EURCV',
    apy: morphoPrimeData.apy,
    tvl: morphoPrimeData.tvl,
    tvlFormatted: morphoPrimeData.tvl > 0 ? formatTVL(morphoPrimeData.tvl) : '—',
    chains: ['Ethereum'],
    chainId: 1,
    color: 'morpho',
    userDeposit: morphoPrimeData.userDeposit,
    isLoading: morphoPrimeData.isLoading,
    isSupported: true,
    stablecoin: 'EURCV',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/ethereum/vault/0x34eCe536d2ae03192B06c0A67030D1Faf4c0Ba43/eurcv-prime',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  const morphoKpk: ProtocolData = {
    id: 'morpho-kpk',
    name: 'kpkEURC Yield',
    description: 'Morpho vault by kpk',
    apy: morphoKpkData.apy,
    tvl: morphoKpkData.tvl,
    tvlFormatted: morphoKpkData.tvl > 0 ? formatTVL(morphoKpkData.tvl) : '—',
    chains: ['Ethereum'],
    chainId: 1,
    color: 'morpho',
    userDeposit: morphoKpkData.userDeposit,
    isLoading: morphoKpkData.isLoading,
    isSupported: true,
    stablecoin: 'EURC',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/ethereum/vault/0x0c6aec603d48eBf1cECc7b247a2c3DA08b398DC1/kpk-eurc-yield',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  // Base Morpho vault entries
  const morphoMoonwell: ProtocolData = {
    id: 'morpho-moonwell',
    name: 'Moonwell Flagship EURC',
    description: 'Morpho vault by Moonwell',
    apy: morphoMoonwellData.apy,
    tvl: morphoMoonwellData.tvl,
    tvlFormatted: morphoMoonwellData.tvl > 0 ? formatTVL(morphoMoonwellData.tvl) : '—',
    chains: ['Base'],
    chainId: 8453,
    color: 'morpho',
    userDeposit: morphoMoonwellData.userDeposit,
    isLoading: morphoMoonwellData.isLoading,
    isSupported: true,
    stablecoin: 'EURC',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/base/vault/0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026/moonwell-flagship-eurc',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  const morphoSteakhouse: ProtocolData = {
    id: 'morpho-steakhouse',
    name: 'Steakhouse EURC',
    description: 'Morpho vault by Steakhouse',
    apy: morphoSteakhouseData.apy,
    tvl: morphoSteakhouseData.tvl,
    tvlFormatted: morphoSteakhouseData.tvl > 0 ? formatTVL(morphoSteakhouseData.tvl) : '—',
    chains: ['Base'],
    chainId: 8453,
    color: 'morpho',
    userDeposit: morphoSteakhouseData.userDeposit,
    isLoading: morphoSteakhouseData.isLoading,
    isSupported: true,
    stablecoin: 'EURC',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/base/vault/0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5/steakhouse-eurc',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  const morphoSteakhousePrime: ProtocolData = {
    id: 'morpho-steakhouse-prime',
    name: 'Steakhouse Prime EURC',
    description: 'Morpho vault by Steakhouse',
    apy: morphoSteakhousePrimeData.apy,
    tvl: morphoSteakhousePrimeData.tvl,
    tvlFormatted: morphoSteakhousePrimeData.tvl > 0 ? formatTVL(morphoSteakhousePrimeData.tvl) : '—',
    chains: ['Base'],
    chainId: 8453,
    color: 'morpho',
    userDeposit: morphoSteakhousePrimeData.userDeposit,
    isLoading: morphoSteakhousePrimeData.isLoading,
    isSupported: true,
    stablecoin: 'EURC',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org/base/vault/0xbeef009F28cCf367444a9F79096862920e025DC1/steakhouse-prime-eurc',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
  };

  // Calculate aggregated Morpho metrics
  const morphoSubProtocols = [morphoGauntlet, morphoPrime, morphoKpk, morphoMoonwell, morphoSteakhouse, morphoSteakhousePrime];
  const morphoTotalTvl = morphoSubProtocols.reduce((sum, p) => sum + p.tvl, 0);
  const morphoTotalDeposit = morphoSubProtocols.reduce((sum, p) => sum + p.userDeposit, 0);
  
  // Highest APY among sub-protocols (for display in collapsed view)
  const morphoHighestApy = Math.max(...morphoSubProtocols.map(p => p.apy));

  // Aggregated Morpho entry
  const morphoGrouped: ProtocolData = {
    id: 'morpho',
    name: 'Morpho',
    description: 'Optimized lending vaults',
    apy: morphoHighestApy,
    tvl: morphoTotalTvl,
    tvlFormatted: formatTVL(morphoTotalTvl),
    chains: ['Ethereum', 'Base'],
    chainId: 1,
    color: 'morpho',
    userDeposit: morphoTotalDeposit,
    isLoading: morphoSubProtocols.some(p => p.isLoading),
    isSupported: true,
    stablecoin: 'EURC',
    logo: morphoLogo,
    learnMoreUrl: 'https://app.morpho.org',
    safetyScore: 93,
    safetyProvider: 'DeFiSafety',
    safetyReportUrl: 'https://defisafety.com/app/pqrs/535',
    isGrouped: true,
    subProtocols: morphoSubProtocols,
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
      auditUrl: 'https://docs.yo.xyz/protocol/security-audits',
      auditProvider: 'YO Docs',
    },
    morphoGrouped,
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
      auditUrl: 'https://fluid.guides.instadapp.io/liquidity-layer/risks',
      auditProvider: 'Instadapp Docs',
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
    morphoPrimeData.refetch();
    morphoKpkData.refetch();
    morphoMoonwellData.refetch();
    morphoSteakhouseData.refetch();
    morphoSteakhousePrimeData.refetch();
    fluidData.refetch();
  };

  return {
    protocols,
    eurcBalance,
    totalDeposits,
    averageApy: weightedApy,
    isLoading: protocols.some(p => p.isLoading),
    refetch,
  };
}
