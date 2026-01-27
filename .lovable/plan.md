

## Update WalletConnect Project ID

### Change Required

Update `src/lib/wagmi.ts` to use the correct WalletConnect Project ID.

---

### Code Change

**File:** `src/lib/wagmi.ts`

```typescript
// Line 12 - Replace old Project ID with new one
const projectId = 'febe70ce29e7ee3a9ffd15e3b6cb90dd';
```

| Current Value | New Value |
|---------------|-----------|
| `dee6813425b34ed1ba9a2f7b1e562b63` | `febe70ce29e7ee3a9ffd15e3b6cb90dd` |

---

### Expected Result

After this change:
1. WalletConnect API calls will return 200 OK instead of 403 Forbidden
2. Clicking "WalletConnect" will show a QR code modal
3. Users can scan the QR code with mobile wallets (MetaMask, Trust, Rainbow, etc.)

---

### Verification

After deployment, test on https://www.eurooo.xyz:
1. Click "Connect Wallet"
2. Select "WalletConnect" from the modal
3. A QR code should appear for scanning with mobile wallets

