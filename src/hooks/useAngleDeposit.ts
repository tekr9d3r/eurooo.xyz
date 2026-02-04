import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { arbitrum } from 'wagmi/chains';
import {
  EURA_ADDRESSES,
  ANGLE_VAULT_ADDRESSES,
  ERC20_ABI,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';

export type AngleDepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

export function useAngleDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<AngleDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const euraAddress = EURA_ADDRESSES[42161];
  const vaultAddress = ANGLE_VAULT_ADDRESSES[42161];
  const isSupported = chainId === 42161;

  const { writeContractAsync } = useWriteContract();

  // Check current allowance
  const { refetch: refetchAllowance } = useReadContract({
    address: euraAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: isSupported && !!address && !!euraAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !euraAddress || !vaultAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    if (!isSupported) {
      setError('Switch to Arbitrum to use Angle');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('checking');

      // EURA has 18 decimals
      const amountInUnits = parseUnits(amount.toString(), 18);

      // Check if we need approval
      const { data: currentAllowance } = await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < amountInUnits;

      if (needsApproval) {
        setStep('approving');
        
        await writeContractAsync({
          address: euraAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [vaultAddress, amountInUnits],
          account: address,
          chain: arbitrum,
        });

        setStep('waitingApproval');

        // Wait for approval
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

      // Deposit to vault
      setStep('depositing');

      const depositTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'deposit',
        args: [amountInUnits, address],
        account: address,
        chain: arbitrum,
      });

      setTxHash(depositTx);
      setStep('waitingDeposit');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Angle deposit error:', e);
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
  }, [address, euraAddress, vaultAddress, isSupported, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    txHash,
    isSupported,
  };
}
