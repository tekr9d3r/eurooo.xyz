

## Add Legal Disclaimer - Footer + Terms Page

### Overview

Add legal protection through two elements:
1. A footer disclaimer visible on all pages
2. A dedicated Terms of Service page at `/terms`

No changes to the deposit flow.

---

### What Will Be Added

#### 1. Footer Disclaimer Update

Add a legal notice to the existing footer:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] eurooo.xyz          [X icon] [Telegram icon]                │
│  Grow Your Euros in DeFi.                                           │
│                                                                     │
│  ──────────────────────────────────────────────────────────────     │
│  eurooo.xyz is an interface for third-party DeFi protocols.        │
│  Deposits go directly to protocols, not Eurooo.                    │
│  Terms of Service ←(link)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2. Terms of Service Page (`/terms`)

A clean, readable page covering:

**Section 1: Nature of Service**
- Eurooo is an aggregator interface only
- We do not operate or control the underlying protocols

**Section 2: Third-Party Protocols**
- Funds are deposited directly to Aave, Morpho, Summer.fi, YO, Fluid
- Eurooo never takes custody of assets
- Each protocol has its own risks and terms

**Section 3: Risk Disclosure**
- Smart contract risks
- Market/liquidity risks
- Regulatory risks
- No guarantee of returns

**Section 4: Limitation of Liability**
- Eurooo not responsible for protocol failures
- No warranty on accuracy of displayed data
- User assumes all risks

**Section 5: User Acknowledgment**
- Users responsible for own research
- Users confirm understanding of DeFi risks

---

### Files to Create

**`src/pages/Terms.tsx`**
- Full Terms of Service page
- Clean typography matching site design
- Back link to home/app

### Files to Modify

**`src/components/Footer.tsx`**
- Add disclaimer text below existing content
- Add link to Terms page

**`src/App.tsx`**
- Add `/terms` route

---

### Visual Design

The footer disclaimer will use:
- `text-xs text-muted-foreground` for subtle appearance
- Centered text below the existing footer content
- Underlined link to Terms page

The Terms page will use:
- Clean headings with proper hierarchy
- Readable paragraph spacing
- Consistent styling with rest of site

