import { createPublicClient, http, fallback } from 'viem';
import { mainnet, base, gnosis, avalanche } from 'wagmi/chains';

// Public clients for fetching protocol data (APY, TVL) regardless of wallet connection
export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http('https://eth.llamarpc.com'),
    http('https://ethereum-rpc.publicnode.com'),
    http('https://rpc.ankr.com/eth'),
    http('https://cloudflare-eth.com'),
  ]),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: fallback([
    http('https://base.llamarpc.com'),
    http('https://base-rpc.publicnode.com'),
    http('https://rpc.ankr.com/base'),
    http('https://base.meowrpc.com'),
  ]),
});

export const gnosisClient = createPublicClient({
  chain: gnosis,
  transport: fallback([
    http('https://rpc.gnosischain.com'),
    http('https://gnosis-rpc.publicnode.com'),
    http('https://rpc.ankr.com/gnosis'),
    http('https://gnosis.drpc.org'),
  ]),
});

export const avalancheClient = createPublicClient({
  chain: avalanche,
  transport: fallback([
    http('https://api.avax.network/ext/bc/C/rpc'),
    http('https://avalanche-c-chain-rpc.publicnode.com'),
    http('https://rpc.ankr.com/avalanche'),
    http('https://avax.meowrpc.com'),
  ]),
});

export function getClientForChain(chainId: number) {
  if (chainId === 1) return ethereumClient;
  if (chainId === 100) return gnosisClient;
  if (chainId === 43114) return avalancheClient;
  return baseClient;
}

// Helper to read contracts with proper typing
export async function readContractMultichain<T>(
  chainId: 1 | 8453 | 100,
  params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }
): Promise<T> {
  const client = getClientForChain(chainId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.readContract(params as any) as Promise<T>;
}
