import { useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import {
  YO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';

export type YoWithdrawStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

export function useYoWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<YoWithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const vaultAddress = YO_VAULT_ADDRESSES[chainId as keyof typeof YO_VAULT_ADDRESSES];

  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  // UI inputs are in EURC (assets). YO vault accounting is share-based, so we
  // convert assets -> shares first, then redeem(shares).
  const withdraw = useCallback(async (assets: bigint) => {
    if (!address || !vaultAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('withdrawing');

      const shares = await publicClient.readContract({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'convertToShares',
        args: [assets],
        // Required by current viem typings (EIP-7702 authorization list)
        authorizationList: [] as any,
      });

      // ERC-4626 redeem: shares -> assets
      const redeemTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'redeem',
        args: [shares, address, address],
        account: address,
        chain: base,
      });

      setTxHash(redeemTx);
      setStep('waitingWithdraw');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('YO withdraw error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
      if (errorMessage.includes('User rejected')) {
        setError('Transaction was rejected');
      } else {
        setError(errorMessage);
      }
      setStep('error');
    }
  }, [address, vaultAddress, writeContractAsync, publicClient]);

  return {
    withdraw,
    step,
    error,
    reset,
    txHash,
    isSupported: !!vaultAddress,
  };
}
