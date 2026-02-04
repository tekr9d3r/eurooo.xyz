

# EUR Stablecoin Stats Page

## Overview

A new `/stats` page that displays comprehensive data about EUR stablecoins, their issuers, supply, and market breakdown. The page will pull data directly from Roinevirta's public GitHub CSV repository, providing a clean, fast, and simple interface that matches the existing eurooo.xyz design language.

## Scope Definition

**Included:**
- Total EUR stablecoin supply overview
- Top stablecoins by supply (ranked list)
- Supply breakdown by backing type, regulatory status, and blockchain
- Issuer directory with key metadata
- Data attribution to source

**Excluded (per request):**
- DeFi opportunities section (handled on `/app`)
- Market Map tab
- Complex filtering/toggle options

---

## Page Structure

```text
+------------------------------------------+
|              Header (existing)           |
+------------------------------------------+
|                                          |
|     Euro Stablecoin Stats                |
|     Simple headline + data source note   |
|                                          |
+------------------------------------------+
|                                          |
|  [Total Supply Card]                     |
|  Large number with "Last updated" note   |
|                                          |
+------------------------------------------+
|                                          |
|  Top Stablecoins by Supply               |
|  Ranked list with ticker, issuer,        |
|  supply amount, and market share %       |
|                                          |
+------------------------------------------+
|                                          |
|  Supply Breakdown (3-column grid)        |
|  - By Backing Type                       |
|  - By Regulatory Status                  |
|  - By Blockchain                         |
|                                          |
+------------------------------------------+
|                                          |
|  Issuer Directory                        |
|  Simple table: Issuer, Ticker, HQ,       |
|  Regulation, Backing, Status             |
|                                          |
+------------------------------------------+
|              Footer (existing)           |
+------------------------------------------+
```

---

## Data Strategy

### Source
Fetch CSV files directly from Roinevirta's public GitHub repository at runtime:
- `MarketCapitalisationData.csv` - Supply by blockchain
- `TokenInformation.csv` - Token metadata (type, regulation, status)
- `IssuerData.csv` - Issuer information

### Fetching Approach
1. Create a single hook (`useStablecoinStats`) that fetches all three CSVs in parallel
2. Parse CSV data client-side (lightweight, no dependencies needed)
3. Cache results in React state with 5-minute stale time
4. Show loading skeletons during fetch
5. Handle errors gracefully with fallback messaging

### Performance Considerations
- Raw GitHub URLs are CORS-enabled and fast
- CSV files are small (under 20KB total)
- Single network request per CSV
- No heavy charting libraries - use simple progress bars for breakdowns

---

## Components to Create

### 1. Stats Page (`src/pages/Stats.tsx`)
Main page component with layout structure

### 2. StatsHero Section
- Page title: "Euro Stablecoin Stats"
- Subtitle explaining the data source
- Total supply card with large formatted number
- Last updated timestamp

### 3. TopStablecoins Component
- Ranked list (top 10) of stablecoins
- Each row shows: rank, ticker, issuer name, supply (EUR), market share %
- Clean card-based design matching existing UI

### 4. SupplyBreakdown Component
- Three-column grid (stacks on mobile)
- Simple horizontal progress bars for percentages
- Categories: Backing Type, Regulatory Status, Blockchain Distribution

### 5. IssuerDirectory Component
- Responsive table/card layout
- Columns: Issuer, Ticker, HQ Country, Regulation Type, Backing, Status
- Status indicators using colored dots (Live, Wind down, Unknown)

### 6. Data Hook (`src/hooks/useStablecoinStats.ts`)
- Fetches and parses all three CSV files
- Calculates derived metrics (totals, percentages, rankings)
- Returns structured data for components

---

## Technical Details

### CSV Parsing
Simple custom parser (no external dependency):

```typescript
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(3).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
  });
}
```

### Data Calculations
- Total supply: Sum all non-empty numeric values from MarketCap CSV
- Market share: (token supply / total supply) * 100
- Backing breakdown: Group by StablecoinType from TokenInfo CSV
- Regulatory breakdown: Group by RegulatoryFramework from TokenInfo CSV
- Blockchain breakdown: Sum columns from MarketCap CSV

### URL Structure
GitHub raw URLs pattern:
`https://raw.githubusercontent.com/roinevirta/euro-stablecoin-research/main/[filename].csv`

---

## UI/UX Considerations

### Matching Existing Design
- Use existing card component with consistent border/shadow
- EU Blue primary color for headings
- Success green for positive metrics
- Muted text for secondary information
- Same responsive breakpoints (md: for desktop)

### Mobile-First
- Single column layout on mobile
- Cards stack vertically
- Table converts to card list on small screens

### Loading States
- Skeleton components for each section
- Animate-pulse effect matching current patterns

### Error Handling
- Graceful fallback message if GitHub is unreachable
- "Data temporarily unavailable" state
- Retry button option

---

## Routing Updates

Add new route in `src/App.tsx`:

```typescript
const Stats = lazy(() => import("./pages/Stats"));

// In Routes:
<Route path="/stats" element={<Stats />} />
```

### Navigation
Add "Stats" link to header navigation (visible on all pages)

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/pages/Stats.tsx` | Create |
| `src/hooks/useStablecoinStats.ts` | Create |
| `src/components/stats/StatsHero.tsx` | Create |
| `src/components/stats/TopStablecoins.tsx` | Create |
| `src/components/stats/SupplyBreakdown.tsx` | Create |
| `src/components/stats/IssuerDirectory.tsx` | Create |
| `src/App.tsx` | Update (add route) |
| `src/components/Header.tsx` | Update (add nav link) |

---

## Attribution

The page will include visible attribution to the data source:
> "Data sourced from roinevirta/euro-stablecoin-research - an open research dataset on euro stablecoins."

With a link to the GitHub repository.

