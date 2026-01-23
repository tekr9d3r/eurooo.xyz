import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { maxUint256 } from 'viem';
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

  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const withdraw = useCallback(async (shares: bigint, withdrawAll = false) => {
    if (!address || !vaultAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('withdrawing');

      // Use maxUint256 for full withdrawal to avoid share/asset conversion issues
      const sharesToRedeem = withdrawAll ? maxUint256 : shares;

      // ERC-4626 redeem: shares -> assets, no approval needed for own shares
      const redeemTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'redeem',
        args: [sharesToRedeem, address, address],
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
  }, [address, vaultAddress, writeContractAsync]);

  return {
    withdraw,
    step,
    error,
    reset,
    txHash,
    isSupported: !!vaultAddress,
  };
}
