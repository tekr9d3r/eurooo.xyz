

# Stats Page Overhaul: DefiLlama Data + Pie Charts

## Overview

This plan replaces the current GitHub CSV-based data source with the DefiLlama Stablecoins API and adds pie chart visualizations for market share comparison. The DefiLlama API is a reliable, well-maintained data source that provides real-time circulating supply data for EUR stablecoins.

## Data Source Change

### Current Approach (Problems)
- Fetching CSV files from GitHub repository
- Inconsistent column naming and metadata rows causing parsing issues
- Data may not be updated frequently
- Complex parsing logic prone to errors

### New Approach (DefiLlama API)
- **Endpoint**: `https://stablecoins.llama.fi/stablecoins`
- **Filter**: Only include stablecoins where `pegType === "peggedEUR"`
- **Data includes**: name, symbol, circulating supply, chains, peg mechanism
- **Benefits**: Real-time data, consistent JSON format, well-maintained, free API

## API Response Structure

The DefiLlama stablecoins API returns a `peggedAssets` array where each stablecoin includes:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (e.g., "euro-tether") |
| `name` | Full name (e.g., "Euro Tether") |
| `symbol` | Ticker symbol (e.g., "EURT") |
| `pegType` | "peggedEUR" for Euro stablecoins |
| `pegMechanism` | "fiat-backed", "crypto-backed", etc. |
| `circulating` | Object with `peggedEUR` amount |
| `chains` | Array of supported blockchain names |
| `chainCirculating` | Supply per chain breakdown |

## Data Fetching Strategy

### Periodic Caching (As Requested)
Rather than fetching on every page load, data will be cached for **30 minutes** to reduce API calls while keeping data reasonably fresh:

```text
User visits /stats
  |
  v
Check cache (30-min TTL)
  |
  +--> Cache valid? --> Return cached data
  |
  +--> Cache stale? --> Fetch from DefiLlama API
                          |
                          v
                       Filter peggedEUR
                          |
                          v
                       Cache result
                          |
                          v
                       Return data
```

## Page Structure (Updated)

```text
+------------------------------------------+
|              Header (existing)           |
+------------------------------------------+
|                                          |
|     Euro Stablecoin Stats                |
|     "Data from DefiLlama" link           |
|                                          |
+------------------------------------------+
|                                          |
|  [Total Supply Card] - Large € amount    |
|                                          |
+------------------------------------------+
|                                          |
|  Top Stablecoins by Market Cap           |
|  Ranked table: #, Symbol, Name, Supply,  |
|  Market Share %, Chains                  |
|                                          |
+------------------------------------------+
|                                          |
|  Market Share Distribution (PIE CHART)   |
|  Visual breakdown of top 10 stablecoins  |
|                                          |
+------------------------------------------+
|                                          |
|  Chain Distribution (PIE CHART)          |
|  Supply breakdown by blockchain          |
|                                          |
+------------------------------------------+
|              Footer (existing)           |
+------------------------------------------+
```

## Pie Chart Implementation

### Using Recharts (Already Installed)
The project already has `recharts` as a dependency, which provides `PieChart`, `Pie`, `Cell`, and `ResponsiveContainer` components.

### Market Share Pie Chart
- Shows top 10 EUR stablecoins by circulating supply
- Groups smaller coins as "Other"
- Interactive tooltips showing exact values
- Clean, simple color palette matching site theme

### Chain Distribution Pie Chart
- Aggregates all EUR stablecoin supply by blockchain
- Shows Ethereum, Base, Polygon, Arbitrum, etc.
- Helps users understand where EUR stablecoins live

### Color Palette
```text
Primary colors (8 distinct):
- EU Blue (#003399) - Primary
- Success Green (#10B981)
- Purple (#8B5CF6)
- Orange (#F97316)
- Pink (#EC4899)
- Cyan (#06B6D4)
- Yellow (#EAB308)
- Gray (#6B7280) - "Other"
```

## Component Changes

### 1. Data Hook (`src/hooks/useStablecoinStats.ts`)
**Complete rewrite** to:
- Fetch from DefiLlama API instead of GitHub CSV
- Filter for `pegType === "peggedEUR"` only
- Cache results for 30 minutes
- Calculate derived metrics (totals, percentages, chain breakdown)
- Return structured data for components

### 2. Remove Issuer Directory
The DefiLlama API doesn't provide issuer metadata (headquarters, regulation status). Since this data would require a second source and adds complexity, we'll simplify by removing the `IssuerDirectory` component.

### 3. Update Stats Page (`src/pages/Stats.tsx`)
- Remove IssuerDirectory section
- Add MarketShareChart component
- Add ChainDistributionChart component
- Update data attribution link to DefiLlama

### 4. Update StatsHero (`src/components/stats/StatsHero.tsx`)
- Change attribution link from GitHub to DefiLlama
- Keep total supply display

### 5. Update TopStablecoins (`src/components/stats/TopStablecoins.tsx`)
- Add "Chains" column showing supported blockchains
- Update data types for new structure
- Keep existing table/mobile card layout

### 6. Replace SupplyBreakdown (`src/components/stats/SupplyBreakdown.tsx`)
- Replace progress bar cards with pie charts
- Create `MarketShareChart` component
- Create `ChainDistributionChart` component

### 7. Delete IssuerDirectory (`src/components/stats/IssuerDirectory.tsx`)
- Remove component entirely (data not available from DefiLlama)

## Technical Details

### New Data Types
```typescript
interface EURStablecoin {
  id: string;
  name: string;
  symbol: string;
  circulating: number;
  marketShare: number;
  chains: string[];
  pegMechanism: string;
}

interface ChainBreakdown {
  chain: string;
  supply: number;
  percentage: number;
}

interface StablecoinStats {
  totalSupply: number;
  stablecoins: EURStablecoin[];
  byChain: ChainBreakdown[];
  lastUpdated: Date | null;
}
```

### Pie Chart Component Structure
```typescript
// Simple recharts pie chart
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={data}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={100}
      label={({ name, percent }) => 
        `${name} ${(percent * 100).toFixed(1)}%`
      }
    >
      {data.map((entry, index) => (
        <Cell key={index} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Tooltip formatter={(value) => formatEuro(value)} />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

### API Call Example
```typescript
const response = await fetch('https://stablecoins.llama.fi/stablecoins');
const data = await response.json();

// Filter for EUR stablecoins only
const eurStablecoins = data.peggedAssets.filter(
  (asset) => asset.pegType === 'peggedEUR'
);
```

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useStablecoinStats.ts` | Rewrite | Switch to DefiLlama API |
| `src/pages/Stats.tsx` | Update | Add pie charts, remove issuer directory |
| `src/components/stats/StatsHero.tsx` | Update | Change attribution to DefiLlama |
| `src/components/stats/TopStablecoins.tsx` | Update | Add chains column, update types |
| `src/components/stats/SupplyBreakdown.tsx` | Rename/Rewrite | Replace with pie chart components |
| `src/components/stats/MarketShareChart.tsx` | Create | Pie chart for top stablecoins |
| `src/components/stats/ChainDistributionChart.tsx` | Create | Pie chart for chain breakdown |
| `src/components/stats/IssuerDirectory.tsx` | Delete | Data not available from DefiLlama |

## UX Improvements

### Faster Loading
- DefiLlama API returns JSON (faster parsing than CSV)
- 30-minute cache reduces redundant API calls
- Single endpoint vs. three CSV files

### Better Visualizations
- Pie charts provide instant visual comparison
- Interactive tooltips for exact values
- Responsive charts work on all screen sizes

### Cleaner Page
- Removed issuer directory (incomplete data)
- Focus on key metrics: total supply, market share, chain distribution
- Matches the "simple, clean, good UX" requirement

## Error Handling

- Show loading skeletons during fetch
- Display "Data temporarily unavailable" if API fails
- Keep "Retry" button for manual refresh
- Fallback to empty state (no cached stale data)

