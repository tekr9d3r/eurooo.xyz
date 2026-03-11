

## Plug Swap App Across the Site

The Swap app at `https://www.swap.eurooo.xyz/` needs prominent placement across the site to drive traffic. All links open in the same window (no `target="_blank"`).

### Changes

**1. Header — `src/components/Header.tsx`**
- Add a "Swap" nav link styled like the "Earn" button but as a secondary/outline variant, positioned next to the Earn button (non-app pages) or next to the Stats link (app page).
- Links to `https://www.swap.eurooo.xyz/`
- No `target="_blank"` — opens in same window.

**2. Hero — `src/components/Hero.tsx`**
- Add a second CTA button next to "Start Earning": **"Get EUR"** (or "Swap to EUR") as an outline/secondary button linking to `https://www.swap.eurooo.xyz/`.
- Two buttons side by side: primary "Start Earning" + outline "Get EUR".

**3. Dashboard — `src/components/Dashboard.tsx`**
- Add a CTA banner above or below the protocol table: "Don't have EUR stablecoins? Swap any crypto to EURC instantly" with a prominent button linking to the Swap app.
- Styled as a gradient card similar to the Telegram CTA but more prominent (primary colors, larger).

**4. Footer — `src/components/Footer.tsx`**
- Add a "Swap" link in the footer navigation area, linking to the Swap app.

### Additional suggestion
- Add a small inline mention in the `PortfolioHeader` area when wallet balance is 0: "No EURC? Get some →" linking to Swap. This contextually drives users who connected a wallet but have no balance.

### Files to modify
- `src/components/Header.tsx` — Add Swap nav link
- `src/components/Hero.tsx` — Add "Get EUR" CTA button
- `src/components/Dashboard.tsx` — Add Swap CTA banner
- `src/components/Footer.tsx` — Add Swap link

