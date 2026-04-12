import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  braveWallet,
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { fallback } from 'viem';
import { mainnet, base, gnosis, avalanche, arbitrum, optimism, polygon } from 'wagmi/chains';

// WalletConnect Cloud project ID (32 characters, no hyphens)
const projectId = 'febe70ce29e7ee3a9ffd15e3b6cb90dd';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        injectedWallet,
        braveWallet,
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        walletConnectWallet,
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
  chains: [mainnet, base, gnosis, avalanche, arbitrum, optimism, polygon],
  transports: {
    [mainnet.id]:   fallback([http('https://eth.llamarpc.com'), http('https://cloudflare-eth.com'), http()]),
    [base.id]:      http(),
    [gnosis.id]:    http(),
    [avalanche.id]: http(),
    [arbitrum.id]:  http(),
    [optimism.id]:  http(),
    [polygon.id]:   http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
