

## Plan: Integrate LI.FI Widget Properly (Native React Component)

### Problem
The current implementation uses an iframe embed, which is not the correct integration. The LI.FI Widget is a React component (`@lifi/widget`) that should be embedded natively.

The previous attempt failed because `@lifi/widget` requires peer dependencies like `@mysten/dapp-kit` and `@solana/wallet-adapter-react` which caused build failures (the Sui SDK has heavy/incompatible transitive deps).

### Key Discovery
From the LI.FI docs: **"If you're using the LI.FI Widget, you do not need to pass an API key."** So the backend proxy (`get-lifi-key`) is not needed for the widget approach.

### Solution
Install the widget with all required peer deps, but **stub out** the Sui and Solana packages in Vite's `resolve.alias` so they don't pull in heavy/incompatible transitive dependencies. The app is EVM-only (RainbowKit + wagmi), so those ecosystems are unused.

### Files to Change

| File | Action |
|------|--------|
| `package.json` | Add `@lifi/widget`, `@bigmi/react`, `@solana/wallet-adapter-react`, `@mysten/dapp-kit` |
| `src/stubs/solana-wallet-adapter.ts` | Create — empty export stub |
| `src/stubs/mysten-dapp-kit.ts` | Create — empty export stub |
| `vite.config.ts` | Add resolve aliases to point Sui/Solana imports to stubs |
| `src/pages/GetEurStablecoins.tsx` | Rewrite — use `<LiFiWidget>` component with `integrator: "eurooo"`, `toChain: 8453`, `toToken: EURC address` |

### Technical Details

**Stub approach for unused ecosystems:**
Vite aliases will redirect `@mysten/dapp-kit` and `@solana/wallet-adapter-react` imports to minimal stub files that export empty objects/functions. This prevents the heavy Sui SDK from being bundled while satisfying the widget's imports at build time.

**Widget configuration:**
```text
LiFiWidget
├── integrator: "eurooo"
├── config.toChain: 8453 (Base)
├── config.toToken: 0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42 (EURC)
├── config.appearance: "auto" (follows app theme)
└── config.theme: custom colors matching app design
```

**No API key needed** — the widget handles authentication internally. The existing `get-lifi-key` edge function can remain for potential future API/SDK use but is not called by this page.

