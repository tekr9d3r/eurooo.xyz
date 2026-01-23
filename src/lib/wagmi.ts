import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';

// WalletConnect project ID from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

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
