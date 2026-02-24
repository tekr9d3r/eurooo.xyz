import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map our internal pool keys to DeFi Llama search criteria
// We match by project, chain, and symbol since pool UUIDs can change
const POOL_MATCHERS: Record<
  string,
  { project: string | string[]; chain: string; symbol: string | string[]; poolId?: string }
> = {
  aaveEthereum: { project: "aave-v3", chain: "Ethereum", symbol: "EURC" },
  aaveBase: { project: "aave-v3", chain: "Base", symbol: "EURC" },
  aaveGnosis: { project: "aave-v3", chain: "Gnosis", symbol: ["EURE", "EURe"] },
  aaveAvalanche: { project: "aave-v3", chain: "Avalanche", symbol: "EURC" },
  yoBase: { project: "yo-protocol", chain: "Base", symbol: "EURC" },
  summerBase: { project: "lazy-summer-protocol", chain: "Base", symbol: "EURC" },
  // Morpho vaults - matched by exact pool ID from DeFi Llama
  morphoGauntlet: { project: "morpho-v1", chain: "Ethereum", symbol: "GTEURCC", poolId: "d4ea65f3-b54b-49c4-81ba-56e16eec4fb7" },
  morphoPrime: { project: "morpho-v1", chain: "Ethereum", symbol: "SGFEURCV", poolId: "4c02c11c-2d48-4d5c-b5ed-27f3f354b73c" },
  morphoKpk: { project: "morpho-v1", chain: "Ethereum", symbol: "KPK-EURC-YIELD", poolId: "994a6438-8611-4c5f-84c0-939330dfbdb0" },
  morphoMoonwell: { project: "morpho-v1", chain: "Base", symbol: "MWEURC", poolId: "c1aee434-6c8e-4958-a851-eda8ab8bb32d" },
  morphoSteakhouse: { project: "morpho-v1", chain: "Base", symbol: "STEAKEURC", poolId: "cd35c563-0b37-47f6-a522-c7e5240b3f65" },
  morphoSteakhousePrime: { project: "morpho-v1", chain: "Base", symbol: "STEAKEURC", poolId: "e76a40b2-30d5-4b9c-9cf3-41249eeeeb3a" },
  fluidBase: { project: "fluid-lending", chain: "Base", symbol: "EURC" },
  moonwellBase: { project: "moonwell-lending", chain: "Base", symbol: "EURC" },
  // Jupiter and Drift don't have EURC lending pools on DeFi Llama - keep hardcoded
};

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
  matcher: { project: string | string[]; chain: string; symbol: string | string[]; poolId?: string }
): boolean {
  // If we have an exact pool ID, use that (most reliable)
  if (matcher.poolId) {
    return pool.pool === matcher.poolId;
  }

  // Otherwise match by project + chain + symbol
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

    // Debug: log all EURC-related pools to help find correct project names


    // Match pools to our keys
    const results: { pool_key: string; apy: number; tvl: number }[] = [];
    const matched = new Set<string>();

    for (const [key, matcher] of Object.entries(POOL_MATCHERS)) {
      const found = pools.find((p) => matchPool(p, matcher));
      if (found) {
        const apy = found.apy ?? found.apyBase ?? 0;
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

    const unmatched = Object.keys(POOL_MATCHERS).filter((k) => !matched.has(k));

    return new Response(
      JSON.stringify({
        matched: results.length,
        total: Object.keys(POOL_MATCHERS).length,
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
