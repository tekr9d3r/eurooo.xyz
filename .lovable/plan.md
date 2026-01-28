

## Add Third-Party Protocol Safety Scores

### Overview

Add DeFiSafety scores to each protocol in the dashboard to help users verify protocol trustworthiness through an independent third-party assessment. DeFiSafety is an established, independent rating organization that evaluates DeFi protocols based on transparency, code quality, audits, and best practices.

---

### What Users Will See

Each protocol row will display a safety score badge with:
- A percentage score (0-100%)
- Color coding: green (80%+), yellow (60-79%), gray (unrated)
- A clickable link to the full DeFiSafety report for verification

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Protocol         │  Safety   │  APY      │  TVL      │  Deposit       │
├───────────────────┼───────────┼───────────┼───────────┼────────────────┤
│  🏛️ Aave          │  93% ✓    │  4.21%    │  €12.4M   │  —             │
│  [EURC] [Ethereum]│  DeFiSafety          │           │                │
├───────────────────┼───────────┼───────────┼───────────┼────────────────┤
│  📊 Morpho        │  93% ✓    │  5.12%    │  €8.2M    │  —             │
│  [EURC] [Ethereum]│  DeFiSafety          │           │                │
├───────────────────┼───────────┼───────────┼───────────┼────────────────┤
│  ☀️ Summer.fi     │  71%      │  3.45%    │  €2.1M    │  —             │
│  [EURC] [Base]    │  DeFiSafety          │           │                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### DeFiSafety Scores (Research Findings)

| Protocol | Score | Report URL |
|----------|-------|------------|
| Aave V3 | 93% | defisafety.com/app/pqrs/597 |
| Morpho | 93% | defisafety.com/app/pqrs/535 |
| Summer.fi | 71% | defisafety.com/app/pqrs/578 |
| YO Protocol | — | Not yet rated |
| Fluid | — | Not yet rated |

---

### Implementation Steps

#### 1. Update Protocol Data Type
Add safety score fields to the `ProtocolData` interface:

```typescript
// src/hooks/useProtocolData.ts
export interface ProtocolData {
  // ... existing fields
  safetyScore?: number;        // 0-100 percentage
  safetyProvider?: string;     // "DeFiSafety" 
  safetyReportUrl?: string;    // Link to full report
}
```

#### 2. Add Safety Scores to Protocol Definitions
Include the researched DeFiSafety scores for each protocol:

```typescript
{
  id: 'aave-ethereum',
  name: 'Aave',
  // ... existing fields
  safetyScore: 93,
  safetyProvider: 'DeFiSafety',
  safetyReportUrl: 'https://defisafety.com/app/pqrs/597',
}
```

#### 3. Create Safety Score Badge Component
A new component to display scores with appropriate styling:

```typescript
// src/components/SafetyScoreBadge.tsx
- Displays score percentage with color coding
- Green badge for 80%+
- Yellow badge for 60-79%
- Gray for unrated protocols
- Tooltip explaining what the score means
- Clickable link to verification report
```

#### 4. Update Protocol Table Display
Integrate the safety badge into both desktop and mobile views:

**Desktop**: Add a new "Safety" column between Protocol and APY
**Mobile**: Show safety badge below protocol name alongside chain badges

#### 5. Add Explanatory Tooltip
When hovering over the score, show:
- What DeFiSafety evaluates (code quality, audits, documentation, team transparency)
- "Click to verify" call-to-action

---

### Visual Design

**Score Color Coding:**
- 80-100%: Green background (`bg-success/20 text-success`)
- 60-79%: Yellow/amber background (`bg-yellow-500/20 text-yellow-600`)
- Below 60%: Red background (`bg-destructive/20 text-destructive`)
- Unrated: Gray with "—" or "Unrated" label

**Badge Format:**
```text
┌─────────────┐
│  93% ✓      │  ← Clickable, opens DeFiSafety report
│  DeFiSafety │
└─────────────┘
```

---

### Technical Details

**Files to Create:**
- `src/components/SafetyScoreBadge.tsx` - New component for score display

**Files to Modify:**
- `src/hooks/useProtocolData.ts` - Add score fields to interface and data
- `src/components/ProtocolTable.tsx` - Integrate badge into table layout

**No External API Required:**
Scores are manually curated from DeFiSafety and stored statically. This ensures:
- Fast loading (no API calls)
- No rate limits or API key requirements
- Full control over displayed data
- Can be updated periodically when DeFiSafety releases new reports

---

### Future Enhancements (Optional)

After initial implementation, could consider:
1. Adding more rating providers (LlamaRisk, OpenCover)
2. Displaying multiple scores from different providers
3. Adding audit information (Certik, Trail of Bits, etc.)
4. Periodic automated checks for score updates

