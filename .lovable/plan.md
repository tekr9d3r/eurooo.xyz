

## Consolidate Aave Pools into Expandable Row

### Overview

Group the three separate Aave entries (Ethereum, Base, Gnosis) into a single expandable row that shows:
- **Collapsed view**: Average APY, combined TVL, total user deposits across all chains
- **Expanded view**: Individual chain details with deposit/withdraw actions for each

This pattern will be reusable for Morpho in the future.

---

### Visual Design

```text
COLLAPSED STATE:
┌────────────────────────────────────────────────────────────────────────────────┐
│  [▼] [Aave Logo]  Aave              4.21%    €85.2M    93%    €500.00   [Deposit ▼]
│                   EURC · 3 chains   avg APY  total TVL        total
└────────────────────────────────────────────────────────────────────────────────┘

EXPANDED STATE:
┌────────────────────────────────────────────────────────────────────────────────┐
│  [▲] [Aave Logo]  Aave              4.21%    €85.2M    93%    €500.00
│                   EURC · 3 chains   avg APY  total TVL        total
├────────────────────────────────────────────────────────────────────────────────┤
│       └─ Ethereum (EURC)            4.52%    €71.5M           €300.00   [Deposit] [Withdraw]
│       └─ Base (EURC)                3.89%    €12.1M           €200.00   [Deposit] [Withdraw]
│       └─ Gnosis (EURe)              4.22%    €1.6M            €0.00     [Deposit]
└────────────────────────────────────────────────────────────────────────────────┘
```

---

### Data Structure Changes

#### New Types in `useProtocolData.ts`:

```typescript
// Extended ProtocolData with optional sub-protocols for grouped entries
export interface ProtocolData {
  // ...existing fields...
  subProtocols?: ProtocolData[];  // Child protocols for expandable groups
  isGrouped?: boolean;            // Flag to indicate this is a parent row
}
```

#### Aggregated Aave Entry:

```typescript
{
  id: 'aave',
  name: 'Aave',
  apy: averageApy,           // Weighted average across chains
  tvl: combinedTvl,          // Sum of all chains
  chains: ['Ethereum', 'Base', 'Gnosis'],
  userDeposit: totalDeposit, // Sum across chains
  isGrouped: true,
  subProtocols: [
    { id: 'aave-ethereum', chainId: 1, ... },
    { id: 'aave-base', chainId: 8453, ... },
    { id: 'aave-gnosis', chainId: 100, ... },
  ]
}
```

---

### Component Changes

#### 1. Update `ProtocolTable.tsx`

- Add `useState` to track expanded protocol groups
- Create `ExpandableProtocolRow` component for grouped protocols
- Keep existing `ProtocolRow` for non-grouped protocols
- Add chevron icon to toggle expansion
- Render sub-rows with indentation when expanded
- Show aggregated deposit button with dropdown for chain selection

#### 2. Update `useProtocolData.ts`

- Create aggregated Aave entry with calculated:
  - Average APY (weighted by TVL or simple average)
  - Combined TVL (sum of all chains)
  - Total user deposit (sum across chains)
- Include individual chain entries as `subProtocols` array
- Remove separate `aave-ethereum`, `aave-base`, `aave-gnosis` from main list

---

### Deposit Flow for Grouped Protocols

When user clicks "Deposit" on the Aave parent row:
1. Show a dropdown/popover with chain options
2. Each option shows chain name + current APY
3. Clicking an option opens deposit modal for that specific chain

Alternatively, when expanded:
- Each sub-row has its own Deposit/Withdraw buttons (simpler approach)

---

### Implementation Details

#### Files to Modify:

**`src/hooks/useProtocolData.ts`**
- Add `subProtocols` field to `ProtocolData` interface
- Create helper function to aggregate Aave data
- Return single "Aave" entry instead of 3 separate ones
- Include sub-protocols for expansion

**`src/components/ProtocolTable.tsx`**
- Add `expandedGroups` state to track which groups are open
- Create `ExpandableProtocolRow` component
- Handle rendering of sub-rows when expanded
- Add expand/collapse toggle button
- Style sub-rows with indentation and lighter background

#### New UI Components:

**Collapsible Row Pattern:**
```typescript
// Parent row with expand toggle
<div className="...parent-row-styles">
  <button onClick={toggleExpand}>
    {isExpanded ? <ChevronUp /> : <ChevronDown />}
  </button>
  {/* Aggregated data */}
</div>

// Child rows (when expanded)
{isExpanded && protocol.subProtocols?.map(sub => (
  <div className="pl-8 bg-secondary/10 ...">
    {/* Individual chain row */}
  </div>
))}
```

---

### Mobile Considerations

On mobile (card layout):
- Parent card shows "3 chains" with expand button
- Expanded state shows stacked sub-cards with chain-specific data
- Each sub-card has its own action buttons

---

### APY Calculation

For the aggregated APY, two options:

**Option A: Simple Average**
```typescript
const avgApy = (ethApy + baseApy + gnosisApy) / 3;
```

**Option B: TVL-Weighted Average** (recommended - shows where most money is)
```typescript
const totalTvl = ethTvl + baseTvl + gnosisTvl;
const avgApy = (ethApy * ethTvl + baseApy * baseTvl + gnosisApy * gnosisTvl) / totalTvl;
```

---

### Summary of Changes

| File | Changes |
|------|---------|
| `src/hooks/useProtocolData.ts` | Add `subProtocols` field, create aggregated Aave entry |
| `src/components/ProtocolTable.tsx` | Add expansion state, create expandable row component |
| `src/components/ui/collapsible.tsx` | Create if needed (or use inline state) |

This design is reusable - when adding more Morpho vaults, the same pattern applies.

