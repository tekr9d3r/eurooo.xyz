

## Add Moonwell Protocol to Dashboard

Moonwell is a lending protocol on Base using EURC with Compound-style mToken interactions (not ERC-4626). This plan adds it as a fully interactive protocol with direct deposit/withdraw from wallet.

### Key Details
- **Chain**: Base (8453)
- **mToken (mEURC)**: `0xb682c840B5F4FC58B20769E691A6fa1305A501a2`
- **Underlying**: EURC on Base (`0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42`)
- **TVL**: 6,015,000 | **APY**: 1.30%
- **Audits**: https://docs.moonwell.fi/moonwell/protocol-information/audits
- **Interface**: Compound-style `mint(uint256)` / `redeemUnderlying(uint256)`

---

### Files to Create

1. **Copy logo** `user-uploads://moonwell-logo.png` to `src/assets/moonwell-logo.png`

2. **`src/hooks/useMoonwellData.ts`** -- Data hook following the Fluid pattern:
   - Read user's mEURC balance via `balanceOf`
   - Convert to underlying value via `balanceOfUnderlying` (or exchange rate)
   - APY/TVL from hardcoded DefiLlama data

3. **`src/hooks/useMoonwellDeposit.ts`** -- Deposit hook:
   - Check/approve EURC allowance to mEURC contract
   - Call `mint(amount)` on the mToken contract
   - Same step pattern as Fluid (idle, checking, approving, waitingApproval, depositing, waitingDeposit, success, error)

4. **`src/hooks/useMoonwellWithdraw.ts`** -- Withdraw hook:
   - Call `redeemUnderlying(amount)` to withdraw exact EURC amount
   - Same step pattern as Fluid withdraw

### Files to Modify

5. **`src/hooks/useDefiLlamaData.ts`** -- Add hardcoded entry:
   ```
   moonwellBase: { apy: 1.30, tvl: 6_015_000 }
   ```

6. **`src/lib/contracts.ts`** -- Add:
   - `MOONWELL_MTOKEN_ADDRESSES` with Base mEURC address
   - `MOONWELL_MTOKEN_ABI` with mint, redeemUnderlying, balanceOf, balanceOfUnderlying, exchangeRateCurrent

7. **`src/index.css`** -- Add `--moonwell` brand color (blue, ~210 70% 50%) in both light and dark themes

8. **`tailwind.config.ts`** -- Add `moonwell: "hsl(var(--moonwell))"` to protocol brand colors

9. **`src/hooks/useProtocolData.ts`** -- Add Moonwell as a new standalone protocol entry:
   - Import `useMoonwellData` and `moonwellLogo`
   - Add `moonwell` to the color union type
   - Create protocol entry with audit badge linking to docs.moonwell.fi/moonwell/protocol-information/audits
   - Add to protocols array and refetch function

10. **`src/components/ProtocolTable.tsx`** -- Add Moonwell to:
    - `protocolLogos` map
    - `colorClasses` map

11. **`src/components/DepositModal.tsx`** -- Wire up Moonwell deposit:
    - Import and instantiate `useMoonwellDeposit`
    - Add `case 'moonwell'` to `getActiveDeposit` switch
    - Add deposit call in `handleConfirm`
    - Add reset in `handleClose` and `handleRetry`

12. **`src/components/WithdrawModal.tsx`** -- Wire up Moonwell withdraw:
    - Import and instantiate `useMoonwellWithdraw`
    - Add `case 'moonwell'` to `getActiveWithdraw` switch
    - Add withdraw call in `handleConfirm`
    - Add reset in `handleClose` and `handleRetry`

13. **`src/components/Hero.tsx`** -- Add Moonwell to:
    - Logo imports and `protocols` array (for "Supported protocols" strip)
    - DefiLlama APY list for highest APY calculation

### Technical Notes

- Moonwell uses Compound v2-style mTokens, not ERC-4626. The key difference:
  - **Deposit**: `approve` EURC to mToken, then call `mint(amount)` where amount is in EURC units
  - **Withdraw**: `redeemUnderlying(amount)` returns exact EURC amount
  - **Balance**: `balanceOfUnderlying(address)` returns EURC value of user's mToken position
- EURC has 6 decimals; exchange rate mantissa is scaled by 1e(18 - 6 + underlying decimals) = 1e18

