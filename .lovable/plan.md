

## Make Safety Scores More Subtle

### Current vs. Proposed Design

**Current (Too Prominent)**
```text
┌─────────────────────────────────────────────────────────────────┐
│  Protocol    │  Safety      │  APY   │  TVL    │  Deposit      │
│              │  ┌────────┐  │        │         │               │
│  Aave        │  │ 93% ✓  │  │ 4.21%  │ €12.4M  │ —             │
│              │  │DeFiSafety│ │        │         │               │
│              │  └────────┘  │        │         │               │
└─────────────────────────────────────────────────────────────────┘
```

**Proposed (Subtle)**
```text
┌───────────────────────────────────────────────────────────────┐
│  Protocol              │  APY   │  TVL    │  Deposit  │ Actions│
│                        │        │         │           │        │
│  🏛️ Aave  93%↗        │ 4.21%  │ €12.4M  │ —         │[Deposit]│
│  [EURC] [Ethereum]     │        │         │           │        │
└───────────────────────────────────────────────────────────────┘
```

---

### Changes to Make

#### 1. Remove Dedicated Safety Column
- Remove the "Safety" column header from the desktop table
- This frees up visual space and reduces clutter

#### 2. Inline Safety Score with Protocol Name
- Move the safety badge to appear next to the protocol name (after the learn more arrow)
- Display as a small, text-only percentage with subtle styling

#### 3. Redesign SafetyScoreBadge for Subtle Display
- Remove colored backgrounds - use plain text styling
- Remove the shield icon (too attention-grabbing)
- Keep only the percentage + external link icon
- Use muted colors that blend with other UI elements
- On hover, reveal the tooltip with full details

#### 4. Mobile View Adjustments
- Remove the safety badge from the badges row
- Display inline with protocol name similar to desktop

---

### Technical Changes

**File: `src/components/SafetyScoreBadge.tsx`**

```typescript
// Before: Colorful badge with background
"inline-flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1"
getScoreColor(score) // bg-success/20 text-success border-success/30

// After: Subtle text-only style
"inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
// No backgrounds, no borders, just subtle text
```

- Remove `ShieldCheck` icon
- Remove `flex-col` layout (make it horizontal/inline)
- Remove provider name display (keep only in tooltip)
- Use `text-muted-foreground` for understated appearance

**File: `src/components/ProtocolTable.tsx`**

Desktop:
- Remove `<div className="col-span-1">Safety</div>` from header
- Remove dedicated Safety column from row grid
- Add safety badge inline after protocol name/learn more link
- Adjust grid from `grid-cols-12` to `grid-cols-11` or redistribute columns

Mobile:
- Remove `SafetyScoreBadge` from badges row
- Add inline with protocol name

---

### Visual Result

The safety score will appear as subtle secondary text:

```text
Aave ↗ 93%↗    ← Protocol name, learn more, then subtle score
[EURC] [Ethereum]
```

Users who care about safety can still:
- See the score at a glance
- Hover for full tooltip explanation
- Click to open the DeFiSafety report

But the dashboard focus remains on APY, TVL, and user deposits.

