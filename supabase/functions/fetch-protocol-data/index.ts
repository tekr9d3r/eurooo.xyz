import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map our internal pool keys to DeFi Llama search criteria
const POOL_MATCHERS: Record<
  string,
  { project: string | string[]; chain: string; symbol: string | string[]; poolId?: string; useBaseApy?: boolean }
> = {
  aaveEthereum: { project: "aave-v3", chain: "Ethereum", symbol: "EURC" },
  aaveBase: { project: "aave-v3", chain: "Base", symbol: "EURC" },
  aaveGnosis: { project: "aave-v3", chain: "Gnosis", symbol: ["EURE", "EURe"] },
  aaveAvalanche: { project: "aave-v3", chain: "Avalanche", symbol: "EURC" },
  yoBase: { project: "yo-protocol", chain: "Base", symbol: "EURC", useBaseApy: true },
  summerBase: { project: "lazy-summer-protocol", chain: "Base", symbol: "EURC" },
  morphoGauntlet: { project: "morpho-v1", chain: "Ethereum", symbol: "GTEURCC", poolId: "d4ea65f3-b54b-49c4-81ba-56e16eec4fb7" },
  morphoPrime: { project: "morpho-v1", chain: "Ethereum", symbol: "SGFEURCV", poolId: "4c02c11c-2d48-4d5c-b5ed-27f3f354b73c" },
  morphoKpk: { project: "morpho-v1", chain: "Ethereum", symbol: "KPK-EURC-YIELD", poolId: "994a6438-8611-4c5f-84c0-939330dfbdb0" },
  morphoMoonwell: { project: "morpho-v1", chain: "Base", symbol: "MWEURC", poolId: "c1aee434-6c8e-4958-a851-eda8ab8bb32d" },
  morphoSteakhouse: { project: "morpho-v1", chain: "Base", symbol: "STEAKEURC", poolId: "cd35c563-0b37-47f6-a522-c7e5240b3f65" },
  morphoSteakhousePrime: { project: "morpho-v1", chain: "Base", symbol: "STEAKEURC", poolId: "e76a40b2-30d5-4b9c-9cf3-41249eeeeb3a" },
  morphoSteakhouseEurcv: { project: "morpho-v1", chain: "Ethereum", symbol: "STEAKEURCV", poolId: "cf3e15c7-bc2c-4e7f-acf2-1fbf544acbb3" },
  morphoSteakhousePrimeInstant: { project: "morpho-v1", chain: "Ethereum", symbol: "STEAKEURCV", poolId: "d3b28212-a46b-4db8-8bb7-2c946b3cbe76" },
  fluidBase: { project: "fluid-lending", chain: "Base", symbol: "EURC" },
  moonwellBase: { project: "moonwell-lending", chain: "Base", symbol: "EURC" },
  // Jupiter's EURC market is not listed on DeFi Llama, so it is fetched
  // separately from Jupiter's own lending API below.
  // Ether.fi's Liquid EUR vault has no public API and is not on DeFi Llama
  // either, so etherfiOptimism stays on the frontend's hardcoded value.
};

const JUPITER_LEND_API = "https://lite-api.jup.ag/lend/v1/earn/tokens";

interface JupiterLendToken {
  symbol: string;
  totalAssets: number | string;
  supplyRate: number;
  rewardsRate: number;
  totalRate: number;
  asset: { symbol: string; decimals: number };
}

interface DefiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
}

function matchPool(
  pool: DefiLlamaPool,
  matcher: { project: string | string[]; chain: string; symbol: string | string[]; poolId?: string; useBaseApy?: boolean }
): boolean {
  if (matcher.poolId) {
    return pool.pool === matcher.poolId;
  }
  const projects = Array.isArray(matcher.project) ? matcher.project : [matcher.project];
  const projectMatch = projects.some(
    (p) => pool.project.toLowerCase() === p.toLowerCase()
  );
  if (!projectMatch) return false;
  if (pool.chain.toLowerCase() !== matcher.chain.toLowerCase()) return false;
  const symbols = Array.isArray(matcher.symbol) ? matcher.symbol : [matcher.symbol];
  const symbolMatch = symbols.some(
    (s) => pool.symbol.toUpperCase().includes(s.toUpperCase())
  );
  return symbolMatch;
}

async function fetchJupiterEurc(): Promise<{ apy: number; tvl: number } | null> {
  const response = await fetch(JUPITER_LEND_API);
  if (!response.ok) {
    throw new Error(`Jupiter Lend API error: ${response.status}`);
  }

  const tokens: JupiterLendToken[] = await response.json();
  const eurc = tokens.find((t) => t.asset?.symbol === "EURC");
  if (!eurc) return null;

  // Rates are basis points. totalRate includes reward incentives, which is the
  // figure Jupiter shows in its UI.
  const apy = eurc.totalRate / 100;

  // Left in EURC rather than converted to USD. The other pools carry DeFi
  // Llama's tvlUsd, but this row has always been maintained in euros and the
  // app labels TVL with a euro sign.
  const tvl = Number(eurc.totalAssets) / 10 ** eurc.asset.decimals;

  return { apy: Math.round(apy * 100) / 100, tvl: Math.round(tvl) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pools from DeFi Llama (single API call)
    console.log("Fetching pools from DeFi Llama...");
    const response = await fetch("https://yields.llama.fi/pools");
    if (!response.ok) {
      throw new Error(`DeFi Llama API error: ${response.status}`);
    }

    const data = await response.json();
    const pools: DefiLlamaPool[] = data.data;
    console.log(`Fetched ${pools.length} pools total`);

    // Match pools to our keys
    const results: { pool_key: string; apy: number; tvl: number }[] = [];
    const matched = new Set<string>();

    for (const [key, matcher] of Object.entries(POOL_MATCHERS)) {
      const found = pools.find((p) => matchPool(p, matcher));
      if (found) {
        const apy = matcher.useBaseApy ? (found.apyBase ?? found.apy ?? 0) : (found.apy ?? found.apyBase ?? 0);
        results.push({
          pool_key: key,
          apy: Math.round(apy * 100) / 100,
          tvl: Math.round(found.tvlUsd),
        });
        matched.add(key);
        console.log(
          `Matched ${key}: pool=${found.pool}, apy=${apy.toFixed(2)}, tvl=${found.tvlUsd}`
        );
      } else {
        console.warn(`No match found for ${key}`);
      }
    }

    // Jupiter comes from its own API. A failure there must not discard the
    // DeFi Llama results, so the snapshot proceeds without it and the frontend
    // falls back to its hardcoded value for that one pool.
    try {
      const jupiter = await fetchJupiterEurc();
      if (jupiter) {
        results.push({ pool_key: "jupiterSolana", ...jupiter });
        matched.add("jupiterSolana");
        console.log(`Matched jupiterSolana: apy=${jupiter.apy}, tvl=${jupiter.tvl}`);
      } else {
        console.warn("No EURC market found in the Jupiter Lend API");
      }
    } catch (error) {
      console.error("Jupiter fetch failed:", error.message);
    }

    // Insert snapshots
    if (results.length > 0) {
      const now = new Date().toISOString();
      const rows = results.map((r) => ({
        pool_key: r.pool_key,
        apy: r.apy,
        tvl: r.tvl,
        fetched_at: now,
      }));

      const { error: insertError } = await supabase
        .from("protocol_snapshots")
        .insert(rows);

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }
    }

    // Cleanup: delete snapshots older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await supabase
      .from("protocol_snapshots")
      .delete()
      .lt("fetched_at", thirtyDaysAgo.toISOString());

    const expectedPools = [...Object.keys(POOL_MATCHERS), "jupiterSolana"];
    const unmatched = expectedPools.filter((k) => !matched.has(k));

    return new Response(
      JSON.stringify({
        matched: results.length,
        total: expectedPools.length,
        unmatched,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
