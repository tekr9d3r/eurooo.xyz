import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';

// WalletConnect project ID - users should replace with their own
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = getDefaultConfig({
  appName: 'EURC Yield Hub',
  projectId,
  chains: [mainnet, base],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
