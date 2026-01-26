

## Fix Mobile Wallet Connection Issues

### Problem Summary
1. **WalletConnect not working**: Clicking the WalletConnect option does nothing because the Project ID format is invalid (36 chars with hyphens instead of 32 chars)
2. **Brave Wallet missing**: The default wallet list doesn't include Brave Wallet

---

### Solution

#### Step 1: Fix WalletConnect Project ID

Update `src/lib/wagmi.ts` to remove hyphens from the project ID:

```typescript
// Before (invalid - 36 characters with hyphens)
const projectId = 'dee68134-25b3-4ed1-ba9a-2f7b1e562b63';

// After (valid - 32 characters, no hyphens)  
const projectId = 'dee6813425b34ed1ba9a2f7b1e562b63';
```

#### Step 2: Add Brave Wallet and Other Mobile Wallets

Replace `getDefaultConfig()` with a custom wallet configuration that includes:
- **Brave Wallet** (for users in Brave browser)
- **Injected Wallet** (catches any browser-injected wallet)
- **MetaMask** (most popular)
- **Coinbase Wallet** (popular mobile wallet)
- **Rainbow** (RainbowKit's native wallet)
- **WalletConnect** (QR code scanning for other wallets)

Updated `src/lib/wagmi.ts`:

```typescript
import { 
  connectorsForWallets,
  getDefaultWallets 
} from '@rainbow-me/rainbowkit';
import {
  braveWallet,
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { mainnet, base, gnosis } from 'wagmi/chains';

const projectId = 'dee6813425b34ed1ba9a2f7b1e562b63';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        injectedWallet,      // Catches Brave and other injected wallets
        braveWallet,         // Explicit Brave support
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        walletConnectWallet, // QR code for mobile wallets
      ],
    },
  ],
  {
    appName: 'EURC Yield Hub',
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [mainnet, base, gnosis],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [gnosis.id]: http(),
  },
});
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/wagmi.ts` | Fix projectId format + custom wallet list with Brave |

---

### Expected Results After Fix

1. **WalletConnect button** will show QR code modal for scanning with mobile wallets
2. **Brave Wallet** will appear in the wallet list when using Brave browser
3. **Any injected wallet** (Trust Wallet in-app browser, etc.) will be detected automatically
4. Mobile users can connect via MetaMask mobile, Coinbase Wallet, Rainbow, or scan WalletConnect QR

---

### Technical Details

The `injectedWallet` connector is important because it uses a generic detection mechanism for any wallet that injects `window.ethereum`. This means:
- Brave browser's built-in wallet
- Trust Wallet's in-app browser
- Any other wallet that injects into the page

The explicit `braveWallet` connector adds Brave-specific branding and deep-link support for mobile.

