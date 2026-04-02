import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DEFILLAMA_API = "https://stablecoins.llama.fi/stablecoins";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const response = await fetch(DEFILLAMA_API);
    if (!response.ok) {
      throw new Error(`DefiLlama responded with ${response.status}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
