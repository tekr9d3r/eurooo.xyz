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
import { mainnet, base, gnosis, avalanche } from 'wagmi/chains';

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
  chains: [mainnet, base, gnosis, avalanche],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [gnosis.id]: http(),
    [avalanche.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
