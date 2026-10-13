#!/usr/bin/env node
/**
 * Refreshes src/data/pool-data.json from upstream sources.
 *
 * Run daily by .github/workflows/update-pool-data.yml. Pools are only
 * overwritten when a source returns a value, so anything without an upstream
 * source — currently Ether.fi — keeps whatever is in the file.
 *
 * Each updated pool keeps its prior apy/tvl as previousApy/previousTvl, which
 * is what the protocol table's change indicators compare against.
 *
 * Usage: node scripts/update-pool-data.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DATA_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../src/data/pool-data.json'
);

const DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';
const JUPITER_LEND_API = 'https://lite-api.jup.ag/lend/v1/earn/tokens';
const EURC_PRICE_API = 'https://coins.llama.fi/prices/current/coingecko:euro-coin';

/**
 * How each pool key is located in DeFi Llama's pool list. A poolId is an exact
 * match; otherwise a pool must match project, chain and symbol.
 */
const POOL_MATCHERS = {
  aaveEthereum: { project: 'aave-v3', chain: 'Ethereum', symbol: 'EURC' },
  aaveBase: { project: 'aave-v3', chain: 'Base', symbol: 'EURC' },
  aaveGnosis: { project: 'aave-v3', chain: 'Gnosis', symbol: ['EURE', 'EURe'] },
  aaveAvalanche: { project: 'aave-v3', chain: 'Avalanche', symbol: 'EURC' },
  yoBase: { project: 'yo-protocol', chain: 'Base', symbol: 'EURC', useBaseApy: true },
  morphoGauntlet: { poolId: 'd4ea65f3-b54b-49c4-81ba-56e16eec4fb7' },
  morphoPrime: { poolId: '4c02c11c-2d48-4d5c-b5ed-27f3f354b73c' },
  morphoMoonwell: { poolId: 'c1aee434-6c8e-4958-a851-eda8ab8bb32d' },
  morphoSteakhouse: { poolId: 'cd35c563-0b37-47f6-a522-c7e5240b3f65' },
  morphoSteakhousePrime: { poolId: 'e76a40b2-30d5-4b9c-9cf3-41249eeeeb3a' },
  morphoSteakhouseEurcv: { poolId: 'cf3e15c7-bc2c-4e7f-acf2-1fbf544acbb3' },
  morphoSteakhousePrimeInstant: { poolId: 'd3b28212-a46b-4db8-8bb7-2c946b3cbe76' },
  fluidBase: { project: 'fluid-lending', chain: 'Base', symbol: 'EURC' },
};

/**
 * Pools with no upstream source, left exactly as they are in the file.
 * Ether.fi's Liquid EUR vault has never been listed by DeFi Llama.
 */
export const MANUAL_POOLS = ['etherfiOptimism'];

export function matchPool(pool, matcher) {
  if (matcher.poolId) return pool.pool === matcher.poolId;
  if (pool.project?.toLowerCase() !== matcher.project.toLowerCase()) return false;
  if (pool.chain?.toLowerCase() !== matcher.chain.toLowerCase()) return false;

  const symbols = Array.isArray(matcher.symbol) ? matcher.symbol : [matcher.symbol];
  return symbols.some((s) => pool.symbol?.toUpperCase().includes(s.toUpperCase()));
}

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Extracts the tracked pools from DeFi Llama's full pool list.
 *
 * DeFi Llama reports lending pools as supplied minus borrowed, so these
 * figures are available liquidity rather than total deposits — which is why
 * the app labels the column "Liquidity". Values are converted from USD to EUR
 * with `eurUsdRate` (USD per EURC) so the whole file is euro-denominated.
 */
export function extractDefiLlamaPools(pools, eurUsdRate) {
  if (!(eurUsdRate > 0)) {
    throw new Error(`Refusing to convert with a bad EUR rate: ${eurUsdRate}`);
  }

  const found = {};
  const missing = [];

  for (const [key, matcher] of Object.entries(POOL_MATCHERS)) {
    const pool = pools.find((p) => matchPool(p, matcher));
    if (!pool) {
      missing.push(key);
      continue;
    }

    const apy = matcher.useBaseApy
      ? (pool.apyBase ?? pool.apy ?? 0)
      : (pool.apy ?? pool.apyBase ?? 0);

    found[key] = { apy: round2(apy), tvl: Math.round(pool.tvlUsd / eurUsdRate) };
  }

  return { found, missing };
}

/** Jupiter's EURC market, which DeFi Llama does not list. */
export function extractJupiterEurc(tokens) {
  const eurc = tokens.find((t) => t.asset?.symbol === 'EURC');
  if (!eurc) return null;

  return {
    // Rates are basis points; totalRate includes reward incentives.
    apy: round2(eurc.totalRate / 100),
    // Left in EURC rather than converted to USD, matching how this row has
    // always been maintained.
    tvl: Math.round(Number(eurc.totalAssets) / 10 ** eurc.asset.decimals),
  };
}

/**
 * Merges freshly fetched values over the existing ones, carrying the prior
 * figures forward so the table can show what changed. Pools absent from
 * `fetched` are left untouched.
 */
export function mergePools(existing, fetched) {
  const merged = { ...existing };
  const changes = [];

  for (const [key, next] of Object.entries(fetched)) {
    const current = existing[key];

    if (current && current.apy === next.apy && current.tvl === next.tvl) {
      merged[key] = current;
      continue;
    }

    merged[key] = {
      apy: next.apy,
      tvl: next.tvl,
      ...(current ? { previousApy: current.apy, previousTvl: current.tvl } : {}),
    };

    changes.push({
      key,
      from: current ? `${current.apy}% / ${current.tvl}` : 'new',
      to: `${next.apy}% / ${next.tvl}`,
    });
  }

  return { merged, changes };
}

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

/**
 * USD per EURC, from the same provider as the pool data so the two stay
 * consistent. A failure here is fatal: converting with a wrong rate, or
 * skipping the conversion, would silently mix dollars and euros in one file.
 */
async function fetchEurUsdRate() {
  const body = await fetchJson(EURC_PRICE_API, 'DeFi Llama prices');
  const quote = body.coins?.['coingecko:euro-coin'];

  if (!(quote?.price > 0)) {
    throw new Error('EURC price missing from the response');
  }
  // A low confidence score means a thin or stale market.
  if (quote.confidence !== undefined && quote.confidence < 0.9) {
    throw new Error(`EURC price confidence too low: ${quote.confidence}`);
  }

  return quote.price;
}

/** Surfaces a message on the GitHub Actions run summary, not just the log. */
function warn(message) {
  console.warn(process.env.GITHUB_ACTIONS ? `::warning::${message}` : `WARNING: ${message}`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const file = JSON.parse(readFileSync(DATA_FILE, 'utf8'));

  const eurUsdRate = await fetchEurUsdRate();
  console.log(`EURC price: $${eurUsdRate} (USD figures are divided by this)`);

  const llama = await fetchJson(DEFILLAMA_POOLS_API, 'DeFi Llama');
  const { found, missing } = extractDefiLlamaPools(llama.data ?? [], eurUsdRate);
  console.log(`DeFi Llama: matched ${Object.keys(found).length}/${Object.keys(POOL_MATCHERS).length} pools`);
  if (missing.length > 0) {
    warn(`DeFi Llama no longer lists ${missing.join(', ')} — those pools keep their existing values and are going stale.`);
  }

  // Jupiter is a separate source; losing it must not discard the DeFi Llama run.
  try {
    const jupiter = extractJupiterEurc(await fetchJson(JUPITER_LEND_API, 'Jupiter Lend'));
    if (jupiter) found.jupiterSolana = jupiter;
    else warn('Jupiter returned no EURC market; that pool keeps its existing value.');
  } catch (error) {
    warn(`Jupiter could not be reached (${error.message}); that pool keeps its existing value.`);
  }

  if (Object.keys(found).length === 0) {
    throw new Error('No pools could be fetched from any source; leaving the file unchanged.');
  }

  const { merged, changes } = mergePools(file.pools, found);

  if (changes.length === 0) {
    console.log('No values changed.');
    return;
  }

  for (const c of changes) console.log(`  ${c.key}: ${c.from} -> ${c.to}`);
  console.log(`${changes.length} pool(s) changed. Manual pools untouched: ${MANUAL_POOLS.join(', ')}`);

  if (dryRun) {
    console.log('Dry run; file not written.');
    return;
  }

  const output = {
    updatedAt: new Date().toISOString(),
    // Recorded for traceability: every converted figure depends on it.
    eurUsdRate,
    pools: merged,
  };
  writeFileSync(DATA_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${DATA_FILE}`);
}

// Only run when invoked directly, so the helpers above stay importable by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
