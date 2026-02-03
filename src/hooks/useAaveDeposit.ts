import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { mainnet, base, gnosis, avalanche } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  AAVE_V3_POOL_ADDRESSES,
  ERC20_ABI,
  AAVE_V3_POOL_ABI,
} from '@/lib/contracts';

export type DepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'supplying' | 'waitingSupply' | 'success' | 'error';

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  100: gnosis,
  43114: avalanche,
} as const;

// Token decimals per chain (EURC = 6, EURe on Gnosis = 18)
const TOKEN_DECIMALS: Record<number, number> = {
  1: 6,
  8453: 6,
  100: 18,
  43114: 6,
};

interface UseAaveDepositReturn {
  deposit: (amount: number) => Promise<void>;
  step: DepositStep;
  error: string | null;
  reset: () => void;
  approvalTxHash: `0x${string}` | undefined;
  supplyTxHash: `0x${string}` | undefined;
}

export function useAaveDeposit(): UseAaveDepositReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<DepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>();
  const [supplyTxHash, setSupplyTxHash] = useState<`0x${string}` | undefined>();

  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const poolAddress = AAVE_V3_POOL_ADDRESSES[chainId as keyof typeof AAVE_V3_POOL_ADDRESSES];
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  const decimals = TOKEN_DECIMALS[chainId] || 6;

  const { writeContractAsync } = useWriteContract();

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: eurcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && poolAddress ? [address, poolAddress] : undefined,
    query: {
      enabled: !!address && !!eurcAddress && !!poolAddress,
    },
  });

  // Wait for approval transaction
  useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  // Wait for supply transaction  
  useWaitForTransactionReceipt({
    hash: supplyTxHash,
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setApprovalTxHash(undefined);
    setSupplyTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !eurcAddress || !poolAddress || !chain) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('checking');

      // Convert amount to token units (6 decimals for EURC, 18 for EURe)
      const amountInUnits = parseUnits(amount.toString(), decimals);

      // Check if we need approval
      await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < amountInUnits;

      if (needsApproval) {
        setStep('approving');
        
        // Request approval
        const approveTx = await writeContractAsync({
          address: eurcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [poolAddress, amountInUnits],
          account: address,
          chain,
        });

        setApprovalTxHash(approveTx);
        setStep('waitingApproval');

        // Wait for approval to be mined by polling allowance
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

          // Timeout after 2 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Approval timeout'));
          }, 120000);
        });
      }

      // Now supply to Aave
      setStep('supplying');

      const supplyTx = await writeContractAsync({
        address: poolAddress,
        abi: AAVE_V3_POOL_ABI,
        functionName: 'supply',
        args: [eurcAddress, amountInUnits, address, 0],
        account: address,
        chain,
      });

      setSupplyTxHash(supplyTx);
      setStep('waitingSupply');

      // Wait a bit for the transaction to be indexed
      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Deposit error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
      // Clean up common error messages
      if (errorMessage.includes('User rejected')) {
        setError('Transaction was rejected');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else {
        setError(errorMessage);
      }
      setStep('error');
    }
  }, [address, eurcAddress, poolAddress, chain, decimals, currentAllowance, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    approvalTxHash,
    supplyTxHash,
  };
}
