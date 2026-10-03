/**
 * Canonical registry of the EUR stablecoin yield opportunities Eurooo tracks.
 *
 * This is the single source of truth shared by the frontend (src/hooks/*) and the
 * public API (api/v1/*). `poolKey` joins each entry to the `protocol_snapshots`
 * table that the fetch-protocol-data edge function populates from DeFi Llama.
 *
 * `id` is part of the public API contract — changing one is a breaking change.
 */

import {
  AAVE_AEURC_ADDRESSES,
  EURC_ADDRESSES,
  EURCV_ADDRESS,
  ETHERFI_WEUR_ADDRESSES,
  FLUID_VAULT_ADDRESSES,
  MOONWELL_MTOKEN_ADDRESSES,
  MORPHO_VAULT_ADDRESSES,
  SUMMER_VAULT_ADDRESSES,
  YO_VAULT_ADDRESSES,
} from '../contracts';

export type YieldAsset = 'EURC' | 'EURe' | 'EURCV';

/** How the deposit earns: direct lending market vs. a curated/managed vault. */
export type YieldStrategy = 'lending' | 'vault';

export interface YieldOpportunityMeta {
  /** Stable public identifier. Part of the API contract. */
  id: string;
  /** Join key into `protocol_snapshots.pool_key`. */
  poolKey: string;
  protocol: string;
  /** Name of the specific market or vault. */
  name: string;
  description: string;
  chain: string;
  /** EVM chain id, or null for non-EVM chains (Solana). */
  chainId: number | null;
  asset: YieldAsset;
  strategy: YieldStrategy;
  /** Protocol page for this specific market or vault. */
  url: string;
  /** Vault / market / receipt-token contract holding the deposit. */
  contractAddress?: string;
  /** Underlying stablecoin token contract on this chain. */
  assetAddress?: string;
  auditUrl?: string;
  auditProvider?: string;
  /**
   * Values served when the snapshot table has no row for this pool yet.
   * Jupiter and Ether.fi are not available via DeFi Llama, so these are their
   * only source and are maintained by hand.
   */
  fallback: { apy: number; tvl: number };
}

export const YIELD_OPPORTUNITIES: readonly YieldOpportunityMeta[] = [
  {
    id: 'aave-ethereum',
    poolKey: 'aaveEthereum',
    protocol: 'Aave',
    name: 'Aave V3 EURC',
    description: 'Leading lending protocol',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x1abaea1f7c830bd89acc67ec4af516284b1bc33c&marketName=proto_mainnet_v3',
    contractAddress: AAVE_AEURC_ADDRESSES[1],
    assetAddress: EURC_ADDRESSES[1],
    auditUrl: 'https://aave.com/security',
    auditProvider: 'Aave Security',
    fallback: { apy: 2.42, tvl: 75_480_000 },
  },
  {
    id: 'aave-base',
    poolKey: 'aaveBase',
    protocol: 'Aave',
    name: 'Aave V3 EURC',
    description: 'Leading lending protocol',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://app.aave.com/reserve-overview/?underlyingAsset=0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42&marketName=proto_base_v3',
    contractAddress: AAVE_AEURC_ADDRESSES[8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://aave.com/security',
    auditProvider: 'Aave Security',
    fallback: { apy: 0.44, tvl: 20_960_000 },
  },
  {
    id: 'aave-gnosis',
    poolKey: 'aaveGnosis',
    protocol: 'Aave',
    name: 'Aave V3 EURe',
    description: 'Leading lending protocol',
    chain: 'Gnosis',
    chainId: 100,
    asset: 'EURe',
    strategy: 'lending',
    url: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xcb444e90d8198415266c6a2724b7900fb12fc56e&marketName=proto_gnosis_v3',
    contractAddress: AAVE_AEURC_ADDRESSES[100],
    assetAddress: EURC_ADDRESSES[100],
    auditUrl: 'https://aave.com/security',
    auditProvider: 'Aave Security',
    fallback: { apy: 3.14, tvl: 16_350_000 },
  },
  {
    id: 'aave-avalanche',
    poolKey: 'aaveAvalanche',
    protocol: 'Aave',
    name: 'Aave V3 EURC',
    description: 'Leading lending protocol',
    chain: 'Avalanche',
    chainId: 43114,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xc891eb4cbdeff6e073e859e987815ed1505c2acd&marketName=proto_avalanche_v3',
    contractAddress: AAVE_AEURC_ADDRESSES[43114],
    assetAddress: EURC_ADDRESSES[43114],
    auditUrl: 'https://aave.com/security',
    auditProvider: 'Aave Security',
    fallback: { apy: 1.93, tvl: 1_250_000 },
  },
  {
    id: 'summer',
    poolKey: 'summerBase',
    protocol: 'Summer.fi',
    name: 'Lazy Summer EURC',
    description: 'Lazy yield vault',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://summer.fi/earn/base/position/0x64db8f51f1bf7064bb5a361a7265f602d348e0f0',
    contractAddress: SUMMER_VAULT_ADDRESSES[8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.summer.fi/summer.fi/audits',
    auditProvider: 'Summer.fi Docs',
    fallback: { apy: 2.5, tvl: 582_000 },
  },
  {
    id: 'yo',
    poolKey: 'yoBase',
    protocol: 'YO Protocol',
    name: 'yoEUR',
    description: 'Multi-chain yield optimizer',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.yo.xyz/vault/base/0x50c749aE210D3977ADC824AE11F3c7fd10c871e9',
    contractAddress: YO_VAULT_ADDRESSES[8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.yo.xyz/protocol/security-audits',
    auditProvider: 'YO Docs',
    fallback: { apy: 2.26, tvl: 1_710_000 },
  },
  {
    id: 'morpho-gauntlet',
    poolKey: 'morphoGauntlet',
    protocol: 'Morpho',
    name: 'Gauntlet EURC Core',
    description: 'Morpho vault by Gauntlet',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.morpho.org/ethereum/vault/0x2ed10624315b74a78f11FAbedAa1A228c198aEfB/gauntlet-eurc-core',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-gauntlet'][1],
    assetAddress: EURC_ADDRESSES[1],
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 3.44, tvl: 5_440_000 },
  },
  {
    id: 'morpho-prime',
    poolKey: 'morphoPrime',
    protocol: 'Morpho',
    name: 'EURCV Prime',
    description: 'Morpho vault for EURCV',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURCV',
    strategy: 'vault',
    url: 'https://app.morpho.org/ethereum/vault/0x34eCe536d2ae03192B06c0A67030D1Faf4c0Ba43/eurcv-prime',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-prime'][1],
    assetAddress: EURCV_ADDRESS,
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 0.78, tvl: 5_780_000 },
  },
  {
    id: 'morpho-kpk',
    poolKey: 'morphoKpk',
    protocol: 'Morpho',
    name: 'kpkEURC Yield',
    description: 'Morpho vault by kpk',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.morpho.org/ethereum/vault/0x0c6aec603d48eBf1cECc7b247a2c3DA08b398DC1/kpk-eurc-yield',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-kpk'][1],
    assetAddress: EURC_ADDRESSES[1],
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 3.57, tvl: 3_000_000 },
  },
  {
    id: 'morpho-steakhouse-eurcv',
    poolKey: 'morphoSteakhouseEurcv',
    protocol: 'Morpho',
    name: 'Steakhouse EURCV',
    description: 'Morpho vault by Steakhouse',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURCV',
    strategy: 'vault',
    url: 'https://app.morpho.org/ethereum/vault/0x75741A12B36D181f44F389E0c6B1E0210311e3Ff/steakhouse-eurcv',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-steakhouse-eurcv'][1],
    assetAddress: EURCV_ADDRESS,
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 0.22, tvl: 32_920_000 },
  },
  {
    id: 'morpho-steakhouse-prime-instant',
    poolKey: 'morphoSteakhousePrimeInstant',
    protocol: 'Morpho',
    name: 'Steakhouse Prime Instant',
    description: 'Morpho vault by Steakhouse',
    chain: 'Ethereum',
    chainId: 1,
    asset: 'EURCV',
    strategy: 'vault',
    url: 'https://app.morpho.org/ethereum/vault/0xbeef0C075Da5D01112AE5cF34d257074fB5DDB2f/steakhouse-prime-instant',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-steakhouse-prime-instant'][1],
    assetAddress: EURCV_ADDRESS,
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 4.04, tvl: 23_500_000 },
  },
  {
    id: 'morpho-moonwell',
    poolKey: 'morphoMoonwell',
    protocol: 'Morpho',
    name: 'Moonwell Flagship EURC',
    description: 'Morpho vault by Moonwell',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.morpho.org/base/vault/0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026/moonwell-flagship-eurc',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-moonwell'][8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 1.17, tvl: 5_530_000 },
  },
  {
    id: 'morpho-steakhouse',
    poolKey: 'morphoSteakhouse',
    protocol: 'Morpho',
    name: 'Steakhouse EURC',
    description: 'Morpho vault by Steakhouse',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.morpho.org/base/vault/0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5/steakhouse-eurc',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-steakhouse'][8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 0.57, tvl: 5_190_000 },
  },
  {
    id: 'morpho-steakhouse-prime',
    poolKey: 'morphoSteakhousePrime',
    protocol: 'Morpho',
    name: 'Steakhouse Prime EURC',
    description: 'Morpho vault by Steakhouse',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://app.morpho.org/base/vault/0xbeef009F28cCf367444a9F79096862920e025DC1/steakhouse-prime-eurc',
    contractAddress: MORPHO_VAULT_ADDRESSES['morpho-steakhouse-prime'][8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.morpho.org/get-started/resources/audits/',
    auditProvider: 'Morpho Docs',
    fallback: { apy: 2.78, tvl: 4_190_000 },
  },
  {
    id: 'fluid',
    poolKey: 'fluidBase',
    protocol: 'Fluid',
    name: 'Fluid EURC',
    description: 'Lending protocol by Instadapp',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://fluid.io/lending/8453/EURC',
    contractAddress: FLUID_VAULT_ADDRESSES[8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://fluid.guides.instadapp.io/liquidity-layer/risks',
    auditProvider: 'Instadapp Docs',
    fallback: { apy: 2.77, tvl: 2_768_000 },
  },
  {
    id: 'moonwell',
    poolKey: 'moonwellBase',
    protocol: 'Moonwell',
    name: 'Moonwell EURC',
    description: 'Lending protocol on Base',
    chain: 'Base',
    chainId: 8453,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://moonwell.fi/vaults/deposit/base/mweurc',
    contractAddress: MOONWELL_MTOKEN_ADDRESSES[8453],
    assetAddress: EURC_ADDRESSES[8453],
    auditUrl: 'https://docs.moonwell.fi/moonwell/protocol-information/audits',
    auditProvider: 'Moonwell Docs',
    fallback: { apy: 1.1, tvl: 5_533_000 },
  },
  {
    id: 'etherfi',
    poolKey: 'etherfiOptimism',
    protocol: 'Ether.fi',
    name: 'Liquid EUR Yield',
    description: 'Liquid Euro yield vault',
    chain: 'Optimism',
    chainId: 10,
    asset: 'EURC',
    strategy: 'vault',
    url: 'https://www.ether.fi/app/cash/earn/liquid/eur-yield',
    contractAddress: ETHERFI_WEUR_ADDRESSES[10],
    auditUrl: 'https://github.com/etherfi-protocol/smart-contracts/tree/master/audits',
    auditProvider: 'Ether.fi GitHub',
    fallback: { apy: 5.61, tvl: 6_530_000 },
  },
  {
    id: 'jupiter',
    poolKey: 'jupiterSolana',
    protocol: 'Jupiter',
    name: 'Jupiter Lend EURC',
    description: 'Solana lending protocol',
    chain: 'Solana',
    chainId: null,
    asset: 'EURC',
    strategy: 'lending',
    url: 'https://jup.ag/lend/earn/EURC/deposit',
    auditUrl: 'https://dev.jup.ag/resources/audits',
    auditProvider: 'Jupiter Docs',
    fallback: { apy: 3.82, tvl: 4_700_000 },
  },
] as const;

export const OPPORTUNITIES_BY_ID: Record<string, YieldOpportunityMeta> = Object.fromEntries(
  YIELD_OPPORTUNITIES.map((o) => [o.id, o])
);

export const OPPORTUNITIES_BY_POOL_KEY: Record<string, YieldOpportunityMeta> = Object.fromEntries(
  YIELD_OPPORTUNITIES.map((o) => [o.poolKey, o])
);

/** Fallback APY/TVL keyed by pool key, as consumed by useDefiLlamaData. */
export const FALLBACK_POOL_DATA: Record<string, { apy: number; tvl: number }> = Object.fromEntries(
  YIELD_OPPORTUNITIES.map((o) => [o.poolKey, o.fallback])
);

export interface TrackedAsset {
  symbol: YieldAsset;
  name: string;
  /** Chains where Eurooo tracks at least one opportunity for this asset. */
  chains: string[];
  opportunityCount: number;
}

const ASSET_NAMES: Record<YieldAsset, string> = {
  EURC: 'Circle Euro Coin',
  EURe: 'Monerium EUR emoney',
  EURCV: 'Société Générale EUR CoinVertible',
};

export function getTrackedAssets(): TrackedAsset[] {
  const bySymbol = new Map<YieldAsset, TrackedAsset>();

  for (const o of YIELD_OPPORTUNITIES) {
    const existing = bySymbol.get(o.asset);
    if (existing) {
      existing.opportunityCount += 1;
      if (!existing.chains.includes(o.chain)) existing.chains.push(o.chain);
    } else {
      bySymbol.set(o.asset, {
        symbol: o.asset,
        name: ASSET_NAMES[o.asset],
        chains: [o.chain],
        opportunityCount: 1,
      });
    }
  }

  return [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}
