

## Plan: Fix LI.FI Widget Build — Export Named Stubs

### Problem
The build fails because the stub files only export `default {}`, but `@lifi/wallet-management` imports **specific named exports** from `@solana/wallet-adapter-react`, `@mysten/dapp-kit`, and `@bigmi/react`. Rollup rightfully complains that `useWallet` is not exported.

### Solution
Update the stub files to export all the named hooks/functions that the widget's wallet-management internals import. These stubs return no-op values so Solana/Sui/Bitcoin code paths are inert but don't break the build.

Additionally, add a stub for `@bigmi/react` and `@bigmi/client` since those are also imported.

### Files to Change

| File | Action |
|------|--------|
| `src/stubs/solana-wallet-adapter.ts` | Rewrite — export `useWallet` returning empty wallet state |
| `src/stubs/mysten-dapp-kit.ts` | Rewrite — export `useCurrentWallet`, `useDisconnectWallet`, `useWallets` as no-ops |
| `src/stubs/bigmi-react.ts` | Create — export `useAccount`, `useConnect`, `useConfig` as no-ops |
| `src/stubs/bigmi-client.ts` | Create — export `disconnect`, `getAccount` as no-ops |
| `src/stubs/solana-wallet-adapter-base.ts` | Create — export `WalletReadyState` enum |
| `vite.config.ts` | Add aliases for `@bigmi/react`, `@bigmi/client`, `@solana/wallet-adapter-base` |

### Technical Details

**Required named exports per stub (from `@lifi/wallet-management` source):**

```text
@solana/wallet-adapter-react → useWallet()
@solana/wallet-adapter-base  → WalletReadyState enum
@mysten/dapp-kit             → useCurrentWallet(), useDisconnectWallet(), useWallets()
@bigmi/react                 → useAccount(), useConnect(), useConfig()
@bigmi/client                → disconnect(), getAccount()
```

Each stub returns safe defaults (empty arrays, disconnected status, no-op functions) so the widget's multi-chain wallet logic gracefully skips non-EVM ecosystems without crashing.

