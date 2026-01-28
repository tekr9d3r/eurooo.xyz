
## Fix Morpho Slow Loading Issue

### Problem Analysis

After comparing all protocol hooks, I found the root causes for Morpho's slow loading:

| Issue | Details |
|-------|---------|
| **Ethereum vs Base** | Morpho queries Ethereum mainnet (slower RPCs) while YO/Summer/Fluid use Base (faster) |
| **6 RPC calls** | 3 Morpho vaults × 2 calls each (balanceOf → convertToAssets) |
| **Sequential waterfall** | convertToAssets waits for balanceOf to complete first |
| **Inconsistent isLoading** | Aave ignores user loading; Morpho/YO/Summer wait for it |

### Why Aave Feels Fast

Looking at `useAaveData.ts` line 82:
```typescript
isLoading: isLoadingDefiLlama  // Only hardcoded data!
```

Aave **ignores** user balance loading states, so it displays immediately with hardcoded data and balances appear when ready.

### Solution: Consistent Loading Strategy

Make all protocol hooks behave like Aave - display hardcoded APY/TVL immediately, and let user balances "pop in" when ready.

### Files to Modify

#### 1. `src/hooks/useMorphoData.ts`
Change isLoading to only wait for hardcoded data:
```typescript
// Before (waits for user balance)
isLoading: isLoadingDefiLlama || (sharesQueryEnabled && isLoadingUserShares) || ...

// After (only hardcoded data)
isLoading: isLoadingDefiLlama
```

#### 2. `src/hooks/useYoData.ts`
Same fix:
```typescript
// Before
isLoading: isLoadingDefiLlama || isLoadingUserShares || isLoadingUserAssets

// After
isLoading: isLoadingDefiLlama
```

#### 3. `src/hooks/useSummerData.ts`
Same fix for consistency.

#### 4. `src/hooks/useFluidData.ts`
Same fix for consistency.

---

### Benefits

| Metric | Before | After |
|--------|--------|-------|
| Morpho load time | 5+ seconds | Instant |
| APY/TVL display | Blocked by RPC | Immediate |
| User balance | Blocked | Loads async (pops in) |
| UX consistency | Mixed behavior | All protocols behave same |

The user balance will simply appear when the RPC calls complete, but the row won't show as "loading" - APY and TVL are visible immediately.
