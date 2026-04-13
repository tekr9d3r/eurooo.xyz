/**
 * Unified vault data for the /earn page.
 *
 * Primary source  : LI.FI Earn API (aave-v3, morpho-v1, yo-protocol EUR vaults)
 *                   All three protocols appear in the API with isTransactional=true.
 * Secondary source: Hardcoded external vaults (manual deposit only, no LI.FI Composer).
 */

import { useDefiLlamaData } from './useDefiLlamaData';
import { useLiFiVaults } from './useLiFiVaults';

export type VaultSource = 'lifi' | 'defillama';

export interface UnifiedVault {
  id: string;
  name: string;
  protocol: string;           // display name
  protocolKey: string;        // internal key e.g. 'aave', 'morpho'
  network: string;
  chainId: number | null;
  token: string;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  apy7d: number | null;
  apy30d: number | null;
  tvl: number;
  tags: string[];
  source: VaultSource;
  isTransactional: boolean;
  // LI.FI specific (for deposit execution)
  lifiAddress?: string;
  lifiTokenAddress?: string;
  lifiTokenDecimals?: number;
  protocolUrl?: string;
}

const LIFI_ALLOWED = ['aave-v3', 'morpho-v1', 'yo-protocol'];

const PROTOCOL_DISPLAY: Record<string, string> = {
  'aave-v3':     'Aave',
  'morpho-v1':   'Morpho',
  'yo-protocol': 'YO',
};

export function useEuroooVaults() {
  const { data: lifiVaults = [], isLoading: lifiLoading, error: lifiError } = useLiFiVaults();
  const defiLlama = useDefiLlamaData();

  // ── LI.FI Earn API vaults ──────────────────────────────────────────────────
  const lifiUnified: UnifiedVault[] = lifiVaults
    .filter((v) => LIFI_ALLOWED.includes(v.protocol.name))
    .map((v) => ({
      id: v.slug,
      name: v.name,
      protocol: PROTOCOL_DISPLAY[v.protocol.name] ?? v.protocol.name,
      protocolKey: v.protocol.name.split('-')[0],
      network: v.network,
      chainId: v.chainId,
      token: v.underlyingTokens[0]?.symbol ?? '—',
      apy: v.analytics.apy.total ?? 0,
      apyBase: v.analytics.apy.base,
      apyReward: v.analytics.apy.reward,
      apy7d: v.analytics.apy7d,
      apy30d: v.analytics.apy30d,
      tvl: Number(v.analytics.tvl.usd),
      tags: v.tags,
      source: 'lifi' as const,
      isTransactional: v.isTransactional,
      lifiAddress: v.address,
      lifiTokenAddress: v.underlyingTokens[0]?.address,
      lifiTokenDecimals: v.underlyingTokens[0]?.decimals,
      protocolUrl: v.protocol.url,
    }));

  // ── External-only vaults (manual deposit, no LI.FI Composer support) ────────
  const externalVaults: UnifiedVault[] = defiLlama.isLoading ? [] : [
    {
      id: 'fluid-base-eurc',
      name: 'Fluid EURC',
      protocol: 'Fluid',
      protocolKey: 'fluid',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.fluidBase.apy,
      apyBase: defiLlama.fluidBase.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.fluidBase.tvl,
      tags: ['stablecoin', 'single'],
      source: 'defillama' as const,
      isTransactional: false,
      protocolUrl: 'https://fluid.io/lending/8453/EURC',
    },
    {
      id: 'summer-base-eurc',
      name: 'Summer EURC Vault',
      protocol: 'Summer',
      protocolKey: 'summer',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.summerBase.apy,
      apyBase: defiLlama.summerBase.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.summerBase.tvl,
      tags: ['stablecoin', 'single'],
      source: 'defillama' as const,
      isTransactional: false,
      protocolUrl: 'https://summer.fi/earn',
    },
    {
      id: 'jupiter-solana-eurc',
      name: 'Jupiter EURC',
      protocol: 'Jupiter',
      protocolKey: 'jupiter',
      network: 'Solana',
      chainId: null,
      token: 'EURC',
      apy: defiLlama.jupiterSolana.apy,
      apyBase: defiLlama.jupiterSolana.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.jupiterSolana.tvl,
      tags: ['stablecoin', 'solana'],
      source: 'defillama' as const,
      isTransactional: false,
      protocolUrl: 'https://jup.ag/',
    },
  ];

  // Merge + sort by APY
  const all = [...lifiUnified, ...externalVaults]
    .sort((a, b) => b.apy - a.apy);

  return {
    vaults: all,
    isLoading: lifiLoading || defiLlama.isLoading,
    error: lifiError,
  };
}
