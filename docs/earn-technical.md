# Eurooo /earn — Technical Architecture

> Hackathon submission documentation for the **Eurooo** EUR yield aggregator.
> This document covers the `/earn` page end-to-end: data sourcing, vault classification, wallet balance reading, and the LI.FI Composer deposit flow.

---

## Overview

The `/earn` page lets users compare and deposit into EUR stablecoin yield vaults across multiple protocols and chains from a single interface. It combines two LI.FI products:

| Product | Role |
|---|---|
| **LI.FI Earn API** (`earn.li.fi`) | Vault discovery — fetches live APY, TVL, token metadata for every supported vault |
| **LI.FI Composer** (`li.quest`) | Deposit execution — bridges + swaps + deposits into the vault in a single on-chain transaction |

The two APIs are complementary: the Earn API tells us _what exists and at what yield_, the Composer tells us _how to get funds there from any chain_.

---

## 1. Data Layer — LI.FI Earn API

### Fetching vaults (`useLiFiVaults.ts`)

The Earn API returns all supported vaults paginated via a cursor. We iterate every page and collect all EUR-denominated vaults:

```ts
// src/hooks/useLiFiVaults.ts
async function fetchAllEurVaults(): Promise<LiFiVault[]> {
  const all: LiFiVault[] = [];
  let cursor: string | null = null;

  while (true) {
    const params = new URLSearchParams({ sortBy: 'apy' });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`/earn-api/v1/earn/vaults?${params}`);
    const json = await res.json();

    // Filter to EUR stablecoins only (EURC, EURe, EURCV, etc.)
    const eurVaults = json.data.filter((v) =>
      v.underlyingTokens.some((t) => t.symbol.toUpperCase().includes('EUR'))
    );
    all.push(...eurVaults);

    cursor = json.nextCursor ?? null;
    if (!cursor) break;
  }

  return all.sort((a, b) => b.analytics.apy.total - a.analytics.apy.total);
}
```

Key fields consumed from each vault object:

| API field | Used for |
|---|---|
| `address` | The vault share token address — used as `toToken` in Composer quotes |
| `protocol.name` | Protocol identifier (`aave-v3`, `morpho-v1`, `yo-protocol`) |
| `underlyingTokens[0]` | Underlying asset symbol, address, decimals |
| `analytics.apy.{base,reward,total}` | APY breakdown shown in the table |
| `analytics.apy7d / apy30d` | 7-day / 30-day trailing APY for the tooltip |
| `analytics.tvl.usd` | Total value locked, shown per vault |
| `isTransactional` | Whether LI.FI Composer supports one-click deposit |
| `tags` | Passed through for display (e.g. `stablecoin`, `single`) |

### Vault filtering and classification (`useEuroooVaults.ts`)

Not all EUR vaults from the API are shown — only protocols where we've validated the Composer integration:

```ts
const LIFI_ALLOWED = ['aave-v3', 'morpho-v1', 'yo-protocol'];
```

Vaults from other protocols still in the API are silently ignored. The allowed vaults are mapped to display names and merged with a small set of _external vaults_ — protocols not supported by the Composer that are added from DefiLlama data with `isTransactional: false`:

```ts
// External vaults (manual deposit only — no LI.FI Composer support)
const externalVaults: UnifiedVault[] = [
  { id: 'fluid-base-eurc',     protocol: 'Fluid',   isTransactional: false, ... },
  { id: 'summer-base-eurc',    protocol: 'Summer',  isTransactional: false, ... },
  { id: 'jupiter-solana-eurc', protocol: 'Jupiter', isTransactional: false, ... },
];
```

The merged list is sorted by APY descending, then grouped by protocol for display.

### Vite dev proxy (CORS bypass)

Both LI.FI endpoints are called via a Vite dev proxy so the browser never hits a cross-origin request:

```ts
// vite.config.ts
proxy: {
  '/earn-api': {
    target: 'https://earn.li.fi',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/earn-api/, ''),
  },
  '/lifi-composer': {
    target: 'https://li.quest',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/lifi-composer/, ''),
  },
},
```

In production the same paths are handled by edge rewrite rules, keeping the API key server-side and avoiding CORS.

---

## 2. Wallet Balance Reading

### Multi-chain wallet assets (`useWalletAssets.ts`)

When the deposit modal opens, it pre-fills the source token and amount from the user's wallet. We use the **Ankr Advanced API** (`ankr_getAccountBalance`) to query all EVM chains in a single RPC call — no need to iterate chain-by-chain:

```ts
const res = await fetch('https://rpc.ankr.com/multichain/...', {
  method: 'POST',
  body: JSON.stringify({
    method: 'ankr_getAccountBalance',
    params: { walletAddress: address, onlyWhitelisted: false },
  }),
});
```

The response is normalized into a `breakdown` array of `{ chainId, symbol, balance, balanceUsd }` entries. The modal then auto-selects the asset with the highest USD value that is also a supported `fromToken`:

```ts
const top = walletAssets.breakdown.find(
  item => FROM_TOKENS[item.chainId]?.some(t => t.symbol === item.symbol)
);
```

### Per-vault deposit balance (`useProtocolData.ts` + individual hooks)

Each protocol has a dedicated hook that reads on-chain balances via wagmi `useReadContract`:

- **Aave** — reads `balanceOf(user)` on the aToken (e.g. `aBasEURC`), which equals the deposited EURC amount directly (aTokens are 1:1 with the underlying).
- **Morpho** — reads `balanceOf(user)` on the vault share token, then calls `convertToAssets(shares)` to get the underlying EURC amount.
- **YO Protocol** — same ERC-4626 pattern: `balanceOf` → `convertToAssets`.
- **Fluid** — ERC-4626 `convertToAssets(balanceOf(user))`.

These per-vault balances are aggregated in `useProtocolData`, which returns a `protocols` array where grouped protocols (Aave, Morpho) carry a `subProtocols` array, each with its own `userDeposit`.

### Mapping vault rows to balances

The vault table maps each vault row to its specific balance using the vault's share token address:

```ts
// src/pages/LiFiEarn.tsx
const VAULT_TO_PROTOCOL_ID: Record<string, string> = {
  '0xaa6e91c82942aeae040303bf96c15a6dbcb82ca0': 'aave-ethereum',
  '0x90da57e0a6c0d166bf15764e03b83745dc90025b': 'aave-base',
  '0xf24608e0ccb972b0b0f4a6446a0bbf58c701a026': 'morpho-moonwell',
  '0xbeef086b8807dc5e5a1740c5e3a7c4c366ea6ab5': 'morpho-steakhouse',
  // ... all Morpho and Aave vaults
};

function buildDepositMap(protocols) {
  const map: Record<string, number> = {};
  for (const p of protocols) {
    const entries = p.subProtocols ?? [p];
    for (const sub of entries) {
      map[sub.id] = sub.userDeposit;  // keyed by sub-protocol ID
    }
  }
  return map;
}
```

Each vault row then looks up its balance by its `lifiAddress` (the vault share token from the Earn API):

```ts
const pid = vault.lifiAddress
  ? VAULT_TO_PROTOCOL_ID[vault.lifiAddress.toLowerCase()]
  : undefined;
const userDeposit = pid ? (depositMap[pid] ?? 0) : 0;
```

This ensures each of the 15+ Morpho vaults shows its own individual balance rather than the sum of all Morpho positions.

---

## 3. Deposit Flow — LI.FI Composer

The Composer is what makes the UX possible: a user on Arbitrum holding USDT can deposit into a Morpho EURC vault on Base in a single wallet confirmation.

### Step 1 — Get a quote

```ts
// GET /lifi-composer/v1/quote
const params = new URLSearchParams({
  fromChain:   String(fromChainId),      // e.g. 42161 (Arbitrum)
  toChain:     String(vault.chainId),    // e.g. 8453 (Base)
  fromToken:   fromToken.address,        // e.g. USDT on Arbitrum
  toToken:     vault.lifiAddress,        // vault share token from Earn API
  fromAddress: address,
  toAddress:   address,
  fromAmount,                            // in token base units (6 decimals for USDT)
});

const res = await fetch(`${COMPOSER_API}/v1/quote?${params}`, {
  headers: { 'x-lifi-api-key': LIFI_API_KEY },
});
```

The `toToken` is always the vault's share token address returned by the Earn API (`vault.address`). The Composer is aware of ERC-4626 vaults and routes the swap output directly into a `deposit()` call — this is what `isTransactional: true` signals in the Earn API response.

The quote response includes:
- `estimate.toAmount` — expected vault shares received
- `estimate.executionDuration` — estimated time in seconds
- `estimate.feeCosts` — itemized fee breakdown in USD
- `includedSteps` — the full execution path (e.g. `SWAP → BRIDGE → SWAP → DEPOSIT`)
- `transactionRequest` — the single calldata payload to submit

### Step 2 — ERC-20 approval (if needed)

For non-native tokens, we check the current allowance and approve the Composer's `approvalAddress` if needed:

```ts
const { data: allowance } = await refetchAllowance();
if (allowance < needed) {
  await writeContractAsync({
    address: fromToken.address,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [approvalAddress, needed],
  });
  // Poll until on-chain allowance reflects the approval
  await pollUntilAllowanceSufficient();
}
```

### Step 3 — Submit the transaction

```ts
const tx = quote.transactionRequest;
await sendTransactionAsync({
  to:      tx.to,
  data:    tx.data,      // encoded bridge + swap + vault deposit calldata
  value:   tx.value ? BigInt(tx.value) : undefined,
  chainId: fromChainId,
  gas:     tx.gasLimit ? BigInt(tx.gasLimit) : undefined,  // must use LI.FI's estimate
});
```

**Why `gas: tx.gasLimit` is required:** The Composer encodes multi-step calldata — bridge message, destination swap, and an ERC-4626 `deposit()` call — into a single transaction. EVM wallets (MetaMask, etc.) routinely underestimate gas for this kind of composed calldata because the gas simulation on the source chain cannot fully predict the destination execution cost. Using LI.FI's pre-computed `gasLimit` prevents the transaction from reverting out-of-gas on the source-chain leg.

### What the Composer executes cross-chain

For a cross-chain deposit (e.g. USDT on Arbitrum → EURC Morpho vault on Base), the full execution path is:

1. **Source chain (Arbitrum):** User sends one transaction. USDT is handed to the bridge contract.
2. **Bridge:** Funds transit via a LI.FI-selected bridge (Stargate, Across, etc.) to Base.
3. **Destination chain (Base):** LI.FI's relayer executes a swap from bridged output token → EURC, then calls `vault.deposit(eurcAmount, userAddress)`. The user receives vault shares directly.

All of this is atomic from the user's perspective — one signature on the source chain.

---

## 4. UI — Vault Table

### Grouping logic

Vaults are grouped by `protocolKey` into `ProtocolGroup` objects. Each group shows:
- Best APY across its vaults
- Total TVL summed across vaults
- User's total deposit across all vaults in the group (sum of per-vault balances)

Groups are sorted: LI.FI transactional protocols first (Aave, Morpho, YO), then external/manual-deposit protocols (Fluid, Summer, Jupiter), each section sorted by best APY.

### Expanded sub-rows

Clicking a grouped row (e.g. Morpho) expands it to show individual vaults — each with its own APY, TVL, and the user's balance in that specific vault. Single-vault protocols (YO, Fluid) are not expandable.

### Portfolio summary

The summary card at the top aggregates the user's total EUR deposit across all protocols and computes a weighted-average APY. It includes a live-ticking balance counter that increments in real time by `totalDeposits × (averageApy / 100) / (365 × 24 × 3600)` per second — purely cosmetic, for illustrative yield visibility.

---

## 5. Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Wallet | wagmi v2 + viem + RainbowKit |
| Data fetching | TanStack React Query |
| UI components | shadcn/ui (Radix primitives + Tailwind) |
| Chain data | LI.FI Earn API + DefiLlama (external vaults) |
| Multi-chain balances | Ankr Advanced API (`ankr_getAccountBalance`) |
| Deposit routing | LI.FI Composer (`/v1/quote` + `transactionRequest`) |
| EUR/USD rate | Open exchange rates API via `useEurUsdRate` |
