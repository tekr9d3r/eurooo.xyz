/**
 * Unified vault data for the /earn page.
 *
 * Primary source  : LI.FI Earn API (yo-protocol EURC vaults)
 * Secondary source: Hardcoded vaults with live APY/TVL from DefiLlama snapshots.
 *                   All hardcoded entries with a lifiAddress have been tested and
 *                   confirmed to work with the LI.FI Composer (li.quest/v1/quote).
 *
 * Confirmed lifiAddress values (toToken for LI.FI Composer):
 *   Aave Ethereum EURC  → 0xAA6e91C82942aeAE040303Bf96c15a6dBcB82CA0  (aEthEURC)
 *   Aave Base EURC      → 0x90DA57E0A6C0d166Bf15764E03b83745Dc90025B  (aBasEURC)
 *   Fluid Base EURC     → 0x1943FA26360f038230442525Cf1B9125b5DCB401  (fEURC)
 *   Morpho Moonwell     → 0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026  (mwEURC / Moonwell Flagship)
 *   Morpho Steakhouse   → 0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5  (steakEURC Base)
 *   Morpho Steak Prime  → 0xbeef009F28cCf367444a9F79096862920e025DC1  (steakEURC Prime Base)
 *   Morpho Gauntlet Eth → 0x2ed10624315b74a78f11FAbedAa1A228c198aEfB  (gteurcc Ethereum)
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

// LI.FI Earn API: only yo-protocol has EUR vaults
const LIFI_ALLOWED = ['yo-protocol'];

const PROTOCOL_DISPLAY: Record<string, string> = {
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

  // ── Hardcoded vaults with LI.FI Composer support ──────────────────────────
  // APY/TVL from DefiLlama snapshots (Supabase). lifiAddress tested & confirmed.
  const transactionalVaults: UnifiedVault[] = defiLlama.isLoading ? [] : [
    // Aave — Ethereum
    {
      id: 'aave-ethereum-eurc',
      name: 'Aave EURC',
      protocol: 'Aave',
      protocolKey: 'aave',
      network: 'Ethereum',
      chainId: 1,
      token: 'EURC',
      apy: defiLlama.aaveEthereum.apy,
      apyBase: defiLlama.aaveEthereum.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.aaveEthereum.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0xAA6e91C82942aeAE040303Bf96c15a6dBcB82CA0',
      lifiTokenAddress: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x1abaea1f7c830bd89acc67ec4af516284b1bc33c&marketName=proto_mainnet_v3',
    },
    // Aave — Base
    {
      id: 'aave-base-eurc',
      name: 'Aave EURC',
      protocol: 'Aave',
      protocolKey: 'aave',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.aaveBase.apy,
      apyBase: defiLlama.aaveBase.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.aaveBase.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0x90DA57E0A6C0d166Bf15764E03b83745Dc90025B',
      lifiTokenAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42&marketName=proto_base_v3',
    },
    // Fluid — Base
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
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0x1943FA26360f038230442525Cf1B9125b5DCB401',
      lifiTokenAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://fluid.io/lending/8453/EURC',
    },
    // Morpho — Moonwell Flagship EURC (Base)
    {
      id: 'morpho-moonwell-base-eurc',
      name: 'Moonwell Flagship EURC',
      protocol: 'Morpho',
      protocolKey: 'morpho',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.morphoMoonwell.apy,
      apyBase: defiLlama.morphoMoonwell.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.morphoMoonwell.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026',
      lifiTokenAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.morpho.org/base/vault/0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026/moonwell-flagship-eurc',
    },
    // Morpho — Steakhouse EURC (Base)
    {
      id: 'morpho-steakhouse-base-eurc',
      name: 'Steakhouse EURC',
      protocol: 'Morpho',
      protocolKey: 'morpho',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.morphoSteakhouse.apy,
      apyBase: defiLlama.morphoSteakhouse.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.morphoSteakhouse.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5',
      lifiTokenAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.morpho.org/base/vault/0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5/steakhouse-eurc',
    },
    // Morpho — Steakhouse Prime EURC (Base)
    {
      id: 'morpho-steakhouse-prime-base-eurc',
      name: 'Steakhouse Prime EURC',
      protocol: 'Morpho',
      protocolKey: 'morpho',
      network: 'Base',
      chainId: 8453,
      token: 'EURC',
      apy: defiLlama.morphoSteakhousePrime.apy,
      apyBase: defiLlama.morphoSteakhousePrime.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.morphoSteakhousePrime.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0xbeef009F28cCf367444a9F79096862920e025DC1',
      lifiTokenAddress: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.morpho.org/base/vault/0xbeef009F28cCf367444a9F79096862920e025DC1/steakhouse-prime-eurc',
    },
    // Morpho — Gauntlet EURC Core (Ethereum)
    {
      id: 'morpho-gauntlet-ethereum-eurc',
      name: 'Gauntlet EURC Core',
      protocol: 'Morpho',
      protocolKey: 'morpho',
      network: 'Ethereum',
      chainId: 1,
      token: 'EURC',
      apy: defiLlama.morphoGauntlet.apy,
      apyBase: defiLlama.morphoGauntlet.apy,
      apyReward: null,
      apy7d: null,
      apy30d: null,
      tvl: defiLlama.morphoGauntlet.tvl,
      tags: ['stablecoin', 'single'],
      source: 'lifi' as const,
      isTransactional: true,
      lifiAddress: '0x2ed10624315b74a78f11FAbedAa1A228c198aEfB',
      lifiTokenAddress: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      lifiTokenDecimals: 6,
      protocolUrl: 'https://app.morpho.org/ethereum/vault/0x2ed10624315b74a78f11FAbedAa1A228c198aEfB/gauntlet-eurc-core',
    },
  ];

  // ── External-only vaults (no LI.FI Composer support) ──────────────────────
  const externalVaults: UnifiedVault[] = defiLlama.isLoading ? [] : [
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
  const all = [...lifiUnified, ...transactionalVaults, ...externalVaults]
    .sort((a, b) => b.apy - a.apy);

  return {
    vaults: all,
    isLoading: lifiLoading || defiLlama.isLoading,
    error: lifiError,
  };
}
