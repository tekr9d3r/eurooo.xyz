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
    // Ankr free public RPCs — more reliable for multi-call balance reads than
    // the default viem public endpoints (cloudflare-eth etc.)
    [mainnet.id]:   http('https://rpc.ankr.com/eth'),
    [base.id]:      http('https://rpc.ankr.com/base'),
    [gnosis.id]:    http('https://rpc.ankr.com/gnosis'),
    [avalanche.id]: http('https://rpc.ankr.com/avalanche'),
    [arbitrum.id]:  http('https://rpc.ankr.com/arbitrum'),
    [optimism.id]:  http('https://rpc.ankr.com/optimism'),
    [polygon.id]:   http('https://rpc.ankr.com/polygon'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
