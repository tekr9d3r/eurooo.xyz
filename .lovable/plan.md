
# GEO/SEO Infrastructure Implementation

## Overview

This plan implements comprehensive GEO (Generative Engine Optimization) and SEO improvements to make eurooo.xyz a quotable, authoritative source for EUR stablecoin data. The goal is to make the site easily discoverable and quotable by search engines and AI systems.

---

## Implementation Scope

### Phase 1: Core SEO Infrastructure
1. **Page-specific meta tags** using react-helmet-async
2. **JSON-LD structured data** for Dataset, WebSite, and FAQPage schemas
3. **Sitemap.xml** for search engine crawling

### Phase 2: Content Optimization
4. **Quotable statistics summary** section on the Stats page
5. **FAQ section** with common EUR stablecoin questions
6. **Enhanced "last updated" timestamps** for freshness signals

---

## Technical Details

### 1. Install react-helmet-async

Add dependency to enable per-page meta tag management:
- Package: `react-helmet-async`
- Used for dynamic title, description, Open Graph, and Twitter Card tags

### 2. Create SEO Component (`src/components/SEO.tsx`)

A reusable component that handles:
- Page title (with site name suffix)
- Meta description
- Canonical URL
- Open Graph tags (title, description, image, type)
- Twitter Card tags
- JSON-LD structured data injection

```text
Props:
- title: string
- description: string
- path: string (for canonical URL)
- type?: "website" | "article"
- jsonLd?: object (optional structured data)
```

### 3. JSON-LD Structured Data

#### WebSite Schema (Home page)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "eurooo.xyz",
  "url": "https://eurooo.xyz",
  "description": "Compare EUR stablecoins...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://eurooo.xyz/stats"
  }
}
```

#### Dataset Schema (Stats page)
```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "EUR Stablecoin Market Data",
  "description": "Real-time circulating supply and market share data for Euro-denominated stablecoins",
  "url": "https://eurooo.xyz/stats",
  "temporalCoverage": "2024/..",
  "creator": {
    "@type": "Organization",
    "name": "eurooo.xyz"
  },
  "distribution": {
    "@type": "DataDownload",
    "contentUrl": "https://eurooo.xyz/stats"
  }
}
```

#### FAQPage Schema (Stats page)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the total EUR stablecoin market cap?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The total EUR stablecoin supply is €[dynamic]..."
      }
    }
  ]
}
```

### 4. Page-Specific SEO Configuration

| Page | Title | Description |
|------|-------|-------------|
| Home | eurooo.xyz - Grow Your Euros in DeFi | Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans. |
| Stats | EUR Stablecoin Market Stats - eurooo.xyz | Real-time data on Euro stablecoin supply, market share, and blockchain distribution. Track EURC, EURS, and more. |
| App | DeFi Yields Dashboard - eurooo.xyz | Compare live APY rates and deposit EUR stablecoins across Aave, Morpho, Summer.fi, and more. |
| Terms | Terms of Service - eurooo.xyz | Terms and conditions for using eurooo.xyz DeFi aggregator. |

### 5. Quotable Statistics Section

Add a new component to the Stats page that displays key figures in a format optimized for quoting:

```text
+--------------------------------------------------+
|  Key EUR Stablecoin Statistics                   |
|                                                  |
|  • Total EUR stablecoin supply: €[X.XX]B         |
|  • Market leader: [Symbol] with [X]% share       |
|  • Number of EUR stablecoins tracked: [N]        |
|  • Available on [N] blockchains                  |
|                                                  |
|  Updated: [Date] • Data: DefiLlama               |
+--------------------------------------------------+
```

### 6. FAQ Section

Add an FAQ component with common questions:

**Questions to include:**
1. "What is the total EUR stablecoin market cap?"
2. "Which EUR stablecoin has the largest market share?"
3. "What blockchains support EUR stablecoins?"
4. "How often is this data updated?"

Each answer dynamically populated from the API data.

### 7. Sitemap.xml

Create a static sitemap at `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://eurooo.xyz/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://eurooo.xyz/stats</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://eurooo.xyz/app</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://eurooo.xyz/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

### 8. Update robots.txt

Add sitemap reference:
```
Sitemap: https://eurooo.xyz/sitemap.xml
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Update | Add react-helmet-async dependency |
| `src/components/SEO.tsx` | Create | Reusable SEO component with meta tags + JSON-LD |
| `src/App.tsx` | Update | Wrap app with HelmetProvider |
| `src/pages/Home.tsx` | Update | Add SEO component with home page meta |
| `src/pages/Stats.tsx` | Update | Add SEO component with Dataset schema |
| `src/pages/App.tsx` | Update | Add SEO component with app page meta |
| `src/pages/Terms.tsx` | Update | Add SEO component with terms page meta |
| `src/components/stats/QuotableStats.tsx` | Create | Key figures summary component |
| `src/components/stats/StatsFAQ.tsx` | Create | FAQ section with schema |
| `public/sitemap.xml` | Create | XML sitemap |
| `public/robots.txt` | Update | Add sitemap reference |

---

## Page Layout After Changes

```text
Stats Page:
+------------------------------------------+
|              Header                       |
+------------------------------------------+
|  StatsHero (Total Supply + 30d Change)   |
+------------------------------------------+
|  QuotableStats (Key Figures Summary)     |  <- NEW
+------------------------------------------+
|  TopStablecoins (Ranked Table)           |
+------------------------------------------+
|  Charts (Market Share + Chain Dist)      |
+------------------------------------------+
|  StatsFAQ (Common Questions)             |  <- NEW
+------------------------------------------+
|              Footer                       |
+------------------------------------------+
```

---

## SEO Benefits

1. **Rich snippets** - FAQ schema enables rich search results
2. **Data attribution** - Dataset schema helps AI cite eurooo.xyz
3. **Crawlability** - Sitemap ensures all pages are indexed
4. **Freshness signals** - Visible timestamps show data currency
5. **Quotable text** - Key figures section provides citation-ready content
6. **Page-specific meta** - Each page has targeted keywords and descriptions
