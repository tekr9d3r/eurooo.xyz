import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';

// WalletConnect Cloud project ID (public identifier)
const projectId = 'dee68134-25b3-4ed1-ba9a-2f7b1e562b63';

export const config = getDefaultConfig({
  appName: 'EURC Yield Hub',
  projectId,
  chains: [mainnet, base],
  appDescription: 'Compare and deposit EURC across DeFi protocols',
  appUrl: typeof window !== 'undefined' ? window.location.origin : '',
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
