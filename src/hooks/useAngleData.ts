import { useReadContract, useAccount } from 'wagmi';
import { useDefiLlamaData } from './useDefiLlamaData';
import { ANGLE_VAULT_ADDRESSES, ERC4626_VAULT_ABI } from '@/lib/contracts';

export function useAngleData() {
  const { address, isConnected } = useAccount();
  const defiLlamaData = useDefiLlamaData();
  
  const vaultAddress = ANGLE_VAULT_ADDRESSES[42161];

  // Get user's shares in the vault
  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: vaultAddress,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 42161,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Convert shares to assets
  const { data: userAssets, refetch: refetchAssets } = useReadContract({
    address: vaultAddress,
    abi: ERC4626_VAULT_ABI,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    chainId: 42161,
    query: {
      enabled: isConnected && !!userShares && userShares > 0n,
    },
  });

  // EURA has 18 decimals
  const userDeposit = userAssets ? Number(userAssets) / 1e18 : 0;

  const refetch = () => {
    refetchShares();
    refetchAssets();
  };

  return {
    apy: defiLlamaData.angleArbitrum.apy,
    tvl: defiLlamaData.angleArbitrum.tvl,
    userDeposit,
    userShares: userShares ?? 0n,
    isLoading: false,
    refetch,
  };
}
