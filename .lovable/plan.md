

## Add Li.Fi Swap Widget on /swap

### What we're building
A new `/swap` page that embeds the Li.Fi Widget for cross-chain swaps/bridges, with a 1% fee directed to your wallets. The page is accessible only via direct URL — no nav links added.

### Dependencies to install
- `@lifi/widget` — the widget itself
- `@bigmi/react` — required peer dependency for Bitcoin wallet support
- `@solana/wallet-adapter-react` — required peer dependency for Solana
- `@mysten/dapp-kit` — required peer dependency for Sui

(wagmi, viem, and @tanstack/react-query are already installed)

### New files

**`src/pages/Swap.tsx`**
- Imports `LiFiWidget` from `@lifi/widget`
- Configures widget with:
  - `integrator: "eurooo"`
  - `fee: 0.01` (1%)
  - Theme styling to match the site (border radius, colors that work in light/dark mode)
  - Fee collection wallets: EVM `0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18`, SVM `6xtfyyZNKcTQsuC5bEURb68ySSpQvNggEB8v1CfEdcMW`
- Renders Header, the widget centered on page, and Footer
- Wrapped in `WagmiReadyGuard` like the App page

### Route registration

**`src/App.tsx`**
- Add lazy import for Swap page
- Add `<Route path="/swap" element={<SwapPage />} />` before the catch-all route

### No navigation changes
The page won't be linked from the header or anywhere else — only accessible via `/swap` directly.

