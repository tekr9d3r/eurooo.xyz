import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import {
  MOONWELL_MTOKEN_ADDRESSES,
  MOONWELL_MTOKEN_ABI,
} from '@/lib/contracts';

export type MoonwellWithdrawStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

export function useMoonwellWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<MoonwellWithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const mTokenAddress = MOONWELL_MTOKEN_ADDRESSES[8453];
  const isSupported = chainId === 8453;

  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  // Withdraw using redeemUnderlying(amount) - withdraws exact EURC amount
  const withdraw = useCallback(async (assets: bigint) => {
    if (!address || !mTokenAddress) {
      setError('Wallet not connected');
      setStep('error');
      return;
    }

    if (!isSupported) {
      setError('Switch to Base to use Moonwell');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('withdrawing');

      const withdrawTx = await writeContractAsync({
        address: mTokenAddress,
        abi: MOONWELL_MTOKEN_ABI,
        functionName: 'redeemUnderlying',
        args: [assets],
        account: address,
        chain: base,
      });

      setTxHash(withdrawTx);
      setStep('waitingWithdraw');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Moonwell withdraw error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
      if (errorMessage.includes('User rejected')) {
        setError('Transaction was rejected');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else {
        setError(errorMessage);
      }
      setStep('error');
    }
  }, [address, mTokenAddress, isSupported, writeContractAsync]);

  return {
    withdraw,
    step,
    error,
    txHash,
    reset,
    isSupported,
  };
}
