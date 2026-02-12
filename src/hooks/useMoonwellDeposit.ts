import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  MOONWELL_MTOKEN_ADDRESSES,
  ERC20_ABI,
  MOONWELL_MTOKEN_ABI,
} from '@/lib/contracts';

export type MoonwellDepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

export function useMoonwellDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<MoonwellDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const eurcAddress = EURC_ADDRESSES[8453];
  const mTokenAddress = MOONWELL_MTOKEN_ADDRESSES[8453];
  const isSupported = chainId === 8453;

  const { writeContractAsync } = useWriteContract();

  const { refetch: refetchAllowance } = useReadContract({
    address: eurcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && mTokenAddress ? [address, mTokenAddress] : undefined,
    query: {
      enabled: isSupported && !!address && !!eurcAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !eurcAddress || !mTokenAddress) {
      setError('Wallet not connected or chain not supported');
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
      setStep('checking');

      const amountInUnits = parseUnits(amount.toString(), 6);

      // Check if we need approval
      const { data: currentAllowance } = await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < amountInUnits;

      if (needsApproval) {
        setStep('approving');
        
        await writeContractAsync({
          address: eurcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [mTokenAddress, amountInUnits],
          account: address,
          chain: base,
        });

        setStep('waitingApproval');

        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(async () => {
            try {
              const { data: newAllowance } = await refetchAllowance();
              if (newAllowance && newAllowance >= amountInUnits) {
                clearInterval(checkInterval);
                resolve();
              }
            } catch (e) {
              clearInterval(checkInterval);
              reject(e);
            }
          }, 2000);

          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Approval timeout'));
          }, 120000);
        });
      }

      // Deposit via mint(amount) on mToken
      setStep('depositing');

      const depositTx = await writeContractAsync({
        address: mTokenAddress,
        abi: MOONWELL_MTOKEN_ABI,
        functionName: 'mint',
        args: [amountInUnits],
        account: address,
        chain: base,
      });

      setTxHash(depositTx);
      setStep('waitingDeposit');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Moonwell deposit error:', e);
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
  }, [address, eurcAddress, mTokenAddress, isSupported, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    txHash,
    isSupported,
  };
}
