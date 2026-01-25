import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { mainnet, base, gnosis } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  AAVE_V3_POOL_ADDRESSES,
  AAVE_V3_POOL_ABI,
} from '@/lib/contracts';

export type WithdrawStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  100: gnosis,
} as const;

// Token decimals per chain (EURC = 6, EURe on Gnosis = 18)
const TOKEN_DECIMALS: Record<number, number> = {
  1: 6,
  8453: 6,
  100: 18,
};

interface UseAaveWithdrawReturn {
  withdraw: (amount: number, withdrawAll?: boolean) => Promise<void>;
  step: WithdrawStep;
  error: string | null;
  reset: () => void;
  withdrawTxHash: `0x${string}` | undefined;
}

export function useAaveWithdraw(): UseAaveWithdrawReturn {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<WithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}` | undefined>();

  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const poolAddress = AAVE_V3_POOL_ADDRESSES[chainId as keyof typeof AAVE_V3_POOL_ADDRESSES];
  const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
  const decimals = TOKEN_DECIMALS[chainId] || 6;

  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setWithdrawTxHash(undefined);
  }, []);

  const withdraw = useCallback(async (amount: number, withdrawAll = false) => {
    if (!address || !eurcAddress || !poolAddress || !chain) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('withdrawing');

      // For "withdraw all", use max uint256 which Aave interprets as full balance
      const amountInUnits = withdrawAll ? maxUint256 : parseUnits(amount.toString(), decimals);

      const withdrawTx = await writeContractAsync({
        address: poolAddress,
        abi: AAVE_V3_POOL_ABI,
        functionName: 'withdraw',
        args: [eurcAddress, amountInUnits, address],
        account: address,
        chain,
      });

      setWithdrawTxHash(withdrawTx);
      setStep('waitingWithdraw');

      // Wait a bit for the transaction to be indexed
      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Withdraw error:', e);
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
  }, [address, eurcAddress, poolAddress, chain, decimals, writeContractAsync]);

  return {
    withdraw,
    step,
    error,
    reset,
    withdrawTxHash,
  };
}
