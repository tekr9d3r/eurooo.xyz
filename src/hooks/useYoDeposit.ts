import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  YO_VAULT_ADDRESSES,
  ERC20_ABI,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';

export type YoDepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

export function useYoDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<YoDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const vaultAddress = YO_VAULT_ADDRESSES[chainId as keyof typeof YO_VAULT_ADDRESSES];

  const { writeContractAsync } = useWriteContract();

  // Check current allowance for vault (deposit directly to vault, not gateway)
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: eurcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: !!address && !!eurcAddress && !!vaultAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !eurcAddress || !vaultAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('checking');

      const amountInUnits = parseUnits(amount.toString(), 6);

      // Check if we need approval for vault
      await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < amountInUnits;

      if (needsApproval) {
        setStep('approving');
        
        await writeContractAsync({
          address: eurcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [vaultAddress, amountInUnits],
          account: address,
          chain: base,
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

      // Deposit directly to ERC-4626 vault
      setStep('depositing');

      const depositTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'deposit',
        args: [amountInUnits, address],
        account: address,
        chain: base,
      });

      setTxHash(depositTx);
      setStep('waitingDeposit');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('YO deposit error:', e);
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
  }, [address, eurcAddress, vaultAddress, currentAllowance, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    txHash,
    isSupported: !!vaultAddress,
  };
}
