

## Add Event Link to Header

**File: `src/components/Header.tsx`**

Add a compact event pill/badge link in both header variants (app page and non-app pages), positioned as the first nav item. The link opens `https://luma.com/mznyc1io` in a new tab.

**Design:**
- Small pill with a pulsing dot (gold/accent color) + text "B€€R. Euros. DeFi."
- On mobile: condensed to "B€€R" to save space
- Styled with `border border-accent/40 bg-accent/10 text-accent` to use the existing EU Gold accent
- Pulsing dot uses a CSS animation (keyframe already possible via tailwind-animate)
- `target="_blank"` with `rel="noopener noreferrer"`

**Placement:** Before the Knowledge Hub link in both the `isAppPage` and non-app branches of the header JSX.

Single file change: `src/components/Header.tsx`.

