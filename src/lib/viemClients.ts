import { createPublicClient, http } from 'viem';
import { mainnet, base } from 'wagmi/chains';

// Public clients for fetching protocol data (APY, TVL) regardless of wallet connection
export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: http(),
});

export function getClientForChain(chainId: number) {
  return chainId === 1 ? ethereumClient : baseClient;
}

// Helper to read contracts with proper typing
export async function readContractMultichain<T>(
  chainId: 1 | 8453,
  params: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }
): Promise<T> {
  const client = chainId === 1 ? ethereumClient : baseClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.readContract(params as any) as Promise<T>;
}
