

## Plan: Store LI.FI API Key Securely and Build the Swap Page

### Step 1: Store the API Key as a Backend Secret
Store the LI.FI API key as `LIFI_API_KEY` (no `VITE_` prefix) so it is only accessible server-side, never bundled into frontend JavaScript.

### Step 2: Create a Backend Function to Serve the Key
Create `supabase/functions/get-lifi-key/index.ts` — a simple endpoint that reads `LIFI_API_KEY` from environment and returns it. This keeps the key out of the client bundle while allowing the widget to use it at runtime.

- CORS headers included
- JWT verification disabled (public endpoint, key is not highly sensitive — it's a rate-limiting key, not a payment key)
- Returns `{ apiKey: "..." }`

### Step 3: Create the Swap Page
**`src/pages/GetEurStablecoins.tsx`** — New page containing:
- Header + Footer (reusing existing components)
- SEO metadata
- On mount, fetches the API key from the backend function
- Renders the `<LiFiWidget>` with:
  - `apiKey` from the backend
  - `integrator: "eurooo"`
  - `toChain: 8453` (Base)
  - `toToken: 0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42` (EURC on Base)
  - Theme matching the app's design

### Step 4: Install Dependency
- Install `@lifi/widget`

### Step 5: Add Route and Navigation
- **`src/App.tsx`**: Add lazy-loaded route for `/get-eur-stablecoins`
- **`src/components/Header.tsx`**: Add navigation link to the swap page

### Files Summary

| File | Action |
|------|--------|
| Secret: `LIFI_API_KEY` | Store securely |
| `supabase/functions/get-lifi-key/index.ts` | Create — serves key to frontend |
| `supabase/config.toml` | Update — disable JWT for new function |
| `src/pages/GetEurStablecoins.tsx` | Create — swap page with LI.FI widget |
| `src/App.tsx` | Edit — add route |
| `src/components/Header.tsx` | Edit — add nav link |

### Security Note
The API key never appears in the JavaScript bundle. It is fetched at runtime from the backend function. While it will be visible in network requests to the backend function, this is acceptable for a rate-limiting API key and is far more secure than embedding it in the build.

