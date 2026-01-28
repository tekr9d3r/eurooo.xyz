
## Fix: Balance Not Displaying When Switching Chains

### Problem Analysis

When you switch chains in your wallet, the total portfolio balance disappears because:

| Issue | Location | Impact |
|-------|----------|--------|
| `useChainId()` dependency | `useEURCBalance.ts` line 8 | Returns connected chain, not a fixed chain |
| Chain-dependent address lookup | `useEURCBalance.ts` line 13 | `EURC_ADDRESSES[chainId]` returns `undefined` for unsupported chains |
| Loading state cascades | `useProtocolData.ts` line 334 | `isLoadingEurc` blocks all data display |

### Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                     User Switches Chain                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ useChainId() → New chain ID (e.g., 100 for Gnosis)              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ EURC_ADDRESSES[100] → undefined (if not mapped) or new address │
│ → Query disabled OR refetching                                   │
│ → isLoading becomes true                                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ useProtocolData.isLoading = isLoadingEurc || protocols.some()   │
│ → isLoading = true                                               │
│ → Total balance not displayed                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight

The EURC wallet balance is only used for the deposit modal's max amount - it should NOT affect the portfolio display. Protocol deposits are fetched from their respective chains with hardcoded `chainId` parameters, independent of the connected chain.

### Solution

Decouple the EURC wallet balance loading state from the protocol data loading state.

### Technical Changes

#### 1. `src/hooks/useProtocolData.ts`

Remove `isLoadingEurc` from the main loading state calculation:

```typescript
// Before (line 334)
isLoading: isLoadingEurc || protocols.some(p => p.isLoading)

// After
isLoading: protocols.some(p => p.isLoading)
```

The EURC balance is passed as `eurcBalance` for the deposit modal, but it doesn't need to block protocol data rendering.

#### 2. `src/hooks/useEURCBalance.ts`

Improve resilience when chain changes:
- Return `0` balance gracefully when on an unsupported chain
- Ensure `isLoading` is `false` when query is disabled (unsupported chain)

```typescript
// Add fallback for unsupported chains
const { data: balance, isLoading: isQueryLoading, ... } = useReadContract({...});

// isLoading should be false if the query is disabled (unsupported chain)
const isLoading = isReady && !!address && !!eurcAddress && isQueryLoading;
```

### Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Page load | ✅ Shows total | ✅ Shows total |
| Switch to supported chain | ❌ Loading... | ✅ Shows total instantly |
| Switch to unsupported chain | ❌ Loading forever | ✅ Shows total (wallet balance = 0) |
| Protocol deposits | ✅ Independent | ✅ Independent |

### Files to Modify

1. **`src/hooks/useEURCBalance.ts`** - Fix isLoading logic for unsupported chains
2. **`src/hooks/useProtocolData.ts`** - Remove EURC loading from main loading state
