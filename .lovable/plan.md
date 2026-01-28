

## Switch to DefiLlama API for APY and TVL Data

### Current Problem

The current implementation fetches APY and TVL data directly from blockchain RPC nodes using on-chain contract calls. This approach has several issues:
- **Slow and unreliable**: Multiple RPC calls needed per protocol
- **Rate limiting**: Even with fallback RPCs, we hit rate limits causing data inconsistencies
- **Buggy TVL values**: Decimal parsing errors occasionally return unrealistic values (scientific notation)
- **Hardcoded APYs**: Some protocols (Summer, YO, Fluid, Morpho) use hardcoded APY estimates instead of real data

### Solution: DefiLlama Yields API

DefiLlama provides a free `/pools` API endpoint that returns:
- **Real-time APY** (`apy` field with 30-day average via `apyMean30d`)
- **TVL in USD** (`tvlUsd` field)
- **Pool metadata** (chain, project, symbol)

API endpoint: `https://yields.llama.fi/pools`

This is a single HTTP call that returns data for thousands of pools, which we can filter client-side.

---

### Architecture Changes

```text
BEFORE (Current - Multiple RPC calls):
┌─────────────────────────────────────────────────────────────────┐
│  useAaveData.ts    →  3 RPC calls (Eth, Base, Gnosis)           │
│  useMorphoData.ts  →  3 RPC calls (3 vaults)                    │
│  useFluidData.ts   →  1 RPC call                                │
│  useSummerData.ts  →  1 RPC call + hardcoded APY                │
│  useYoData.ts      →  1 RPC call + hardcoded APY                │
└─────────────────────────────────────────────────────────────────┘
Total: 9+ RPC calls, prone to rate limits and errors

AFTER (DefiLlama API - Single HTTP call):
┌─────────────────────────────────────────────────────────────────┐
│  useDefiLlamaData.ts  →  1 API call (fetches all pools)         │
│  Filter and map to our protocol IDs                             │
│  Return { apy, tvl } for each protocol/pool                     │
└─────────────────────────────────────────────────────────────────┘
Total: 1 HTTP call, cached response, reliable data
```

---

### Pool Identification Strategy

We need to map DefiLlama pool IDs to our protocol entries. DefiLlama pools can be identified by:
- `project` field (e.g., "aave-v3", "morpho", "fluid", "summer-fi")
- `chain` field (e.g., "Ethereum", "Base", "Gnosis")
- `symbol` field (e.g., "EURC", "EURe")
- `pool` address (contract address - most reliable)

**Mapping approach:**
| Our Protocol | DefiLlama Filter |
|--------------|------------------|
| Aave Ethereum | project=aave-v3, chain=Ethereum, symbol contains EURC |
| Aave Base | project=aave-v3, chain=Base, symbol contains EURC |
| Aave Gnosis | project=aave-v3, chain=Gnosis, symbol contains EURe |
| Morpho Gauntlet | pool address match or project=morpho-blue |
| Morpho Prime | pool address match |
| Morpho KPK | pool address match |
| Summer.fi | project=summer-fi, chain=Base, symbol contains EURC |
| YO Protocol | project=yo or pool address match |
| Fluid | project=fluid, chain=Base, symbol contains EURC |

---

### Files to Create/Modify

#### 1. Create `src/hooks/useDefiLlamaData.ts` (NEW)

A centralized hook that:
- Fetches all pools from DefiLlama in a single call
- Filters for EURC/EURe stablecoin pools
- Returns APY and TVL for each of our protocols
- Uses React Query with 5-minute cache (data doesn't change often)

```typescript
interface DefiLlamaPool {
  pool: string;           // Pool address/ID
  chain: string;          // "Ethereum", "Base", "Gnosis"
  project: string;        // "aave-v3", "morpho", "fluid"
  symbol: string;         // "EURC", "EURe"
  tvlUsd: number;         // TVL in USD
  apy: number;            // Current APY %
  apyMean30d?: number;    // 30-day average APY
}
```

#### 2. Modify `src/hooks/useAaveData.ts`

- Replace on-chain APY/TVL fetching with DefiLlama data
- Keep user balance fetching (still needs on-chain for user-specific data)

#### 3. Modify `src/hooks/useMorphoData.ts`

- Replace on-chain APY/TVL fetching with DefiLlama data
- Keep user balance fetching

#### 4. Modify `src/hooks/useFluidData.ts`

- Replace on-chain APY/TVL fetching with DefiLlama data
- Keep user balance fetching

#### 5. Modify `src/hooks/useSummerData.ts`

- Replace hardcoded APY with real DefiLlama data
- Replace on-chain TVL with DefiLlama data
- Keep user balance fetching

#### 6. Modify `src/hooks/useYoData.ts`

- Replace hardcoded APY with real DefiLlama data
- Replace on-chain TVL with DefiLlama data
- Keep user balance fetching

---

### Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| API calls | 9+ RPC calls | 1 HTTP call |
| Rate limiting | Common issue | Not a concern |
| APY accuracy | Hardcoded/calculated | Real 30-day average |
| TVL accuracy | Decimal errors possible | Pre-validated USD value |
| Load time | Slow (sequential RPCs) | Fast (single cached call) |
| Maintenance | Update each hook | Single source of truth |

---

### Technical Details

#### DefiLlama API Response Structure
```json
{
  "status": "success",
  "data": [
    {
      "pool": "0x2ed10624315b74a78f11FAbedAa1A228c198aEfB",
      "chain": "Ethereum",
      "project": "morpho-blue",
      "symbol": "EURC",
      "tvlUsd": 15234567.89,
      "apy": 4.38,
      "apyMean30d": 4.25
    }
  ]
}
```

#### Caching Strategy
- Cache DefiLlama response for 5 minutes (staleTime: 300000)
- Background refetch every 5 minutes (refetchInterval: 300000)
- Use `placeholderData` to preserve valid data during refetches

#### User Balances (Keep On-Chain)
User-specific data (deposits, shares) must still be fetched from blockchain:
- Use `useReadContract` with explicit `chainId` for each chain
- This is a small number of calls only when wallet is connected
- No change to current user balance fetching logic

---

### Fallback Strategy

If DefiLlama API is unavailable:
1. Return cached data if available
2. Fall back to hardcoded estimates as last resort
3. Log warning for debugging

---

### Summary of Changes

| File | Action | Changes |
|------|--------|---------|
| `src/hooks/useDefiLlamaData.ts` | CREATE | New centralized hook for DefiLlama API |
| `src/hooks/useAaveData.ts` | MODIFY | Use DefiLlama for APY/TVL, keep user balances |
| `src/hooks/useMorphoData.ts` | MODIFY | Use DefiLlama for APY/TVL, keep user balances |
| `src/hooks/useFluidData.ts` | MODIFY | Use DefiLlama for APY/TVL, keep user balances |
| `src/hooks/useSummerData.ts` | MODIFY | Use DefiLlama for APY/TVL, keep user balances |
| `src/hooks/useYoData.ts` | MODIFY | Use DefiLlama for APY/TVL, keep user balances |

This refactor will provide reliable, accurate, and fast APY/TVL data from a single trusted source while maintaining user-specific on-chain balance fetching.

