

## Automating APY & TVL Data with Change Tracking

### The Core Challenge

You asked about doing this **without a database** -- but to show "how much data changed in the last 3 days," you inherently need to store previous snapshots somewhere. There are two realistic approaches:

---

### Option A: Edge Function + Database (Recommended)

Since your project already has Lovable Cloud, you have a database available at no extra cost. This is the clean approach:

**How it works:**
1. A **backend function** fetches APY/TVL from DeFi Llama's `/yields/pools` API every 3 days
2. Each fetch stores a **snapshot** in a `protocol_snapshots` table (pool_id, apy, tvl, timestamp)
3. The frontend queries the latest snapshot + the one from 3 days ago, calculates % change client-side
4. A **30-minute client-side cache** (via React Query) prevents hammering the backend

**What gets built:**
- `supabase/functions/fetch-protocol-data/` -- edge function that hits DeFi Llama, stores results
- `protocol_snapshots` table -- (id, pool_id, apy, tvl, fetched_at)
- Updated `useDefiLlamaData.ts` -- fetches from your own backend instead of hardcoded values, includes `previousApy` and `previousTvl` for change calculation
- UI badges showing "+5.2% TVL" / "-0.3% APY" next to each protocol

**DeFi Llama pools used** (matched to your protocols):

```text
Protocol              DeFi Llama Pool ID
─────────────────────────────────────────
Aave Ethereum         e3f0b7b2-...  (search by project=aave, chain=Ethereum, symbol=EURC)
Aave Base             (same project, chain=Base)
Aave Gnosis           (chain=Gnosis, symbol=EURe)
Aave Avalanche        (chain=Avalanche)
Morpho vaults         Each vault has its own pool ID
Fluid, Moonwell       Same pattern
Jupiter, Drift        Solana pools
```

**Scheduling:** The edge function is called via a **pg_cron job** every 3 days, or manually triggered. No external scheduler needed.

**Pros:** Reliable, historical data for trends, fast frontend loads (your own API), no rate limiting issues.
**Cons:** Uses database (but it's already available and free).

---

### Option B: Client-Side Only (No Database)

Fetch directly from DeFi Llama API on each page load with client caching. Store "previous" values in `localStorage`.

**Pros:** No backend needed.
**Cons:** 
- Rate limiting (you hit this before -- it's why you switched to hardcoded)
- Slow initial loads (16+ API calls)
- localStorage "previous" values are per-device, not shared across users
- Change percentages would be inaccurate/inconsistent between users

---

### Recommendation

**Option A is clearly better** for your use case. You already have the backend infrastructure, and the "% change" feature fundamentally requires shared persistent state. The edge function approach also solves the original problems (rate limiting, slow loads) that led to hardcoding in the first place.

The DeFi Llama `/pools` endpoint returns all pools in one call -- we filter server-side by known pool IDs, so it's a single HTTP request every 3 days rather than 16 separate calls.

Shall I proceed with Option A?

