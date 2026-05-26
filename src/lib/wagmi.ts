import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { fallback, http } from 'viem';
import { mainnet, base, gnosis, avalanche, arbitrum, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Eurooo',
  projectId: 'febe70ce29e7ee3a9ffd15e3b6cb90dd',
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
  ssr: false,
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
