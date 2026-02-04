import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { arbitrum } from 'wagmi/chains';
import {
  ANGLE_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';

export type AngleWithdrawStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

export function useAngleWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<AngleWithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const vaultAddress = ANGLE_VAULT_ADDRESSES[42161];
  const isSupported = chainId === 42161;

  const { writeContractAsync } = useWriteContract();

  // Get user's current share balance for the vault
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
      enabled: !!address && !!vaultAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  // Withdraw using the ERC4626 withdraw function (takes assets, not shares)
  const withdraw = useCallback(async (assets: bigint) => {
    if (!address || !vaultAddress) {
      setError('Wallet not connected');
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
      setStep('withdrawing');

      // Use withdraw function which takes assets amount
      const withdrawTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'withdraw',
        args: [assets, address, address],
        account: address,
        chain: arbitrum,
      });

      setTxHash(withdrawTx);
      setStep('waitingWithdraw');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Angle withdraw error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
      if (errorMessage.includes('User rejected')) {
        setError('Transaction was rejected');
      } else if (errorMessage.includes('insufficient funds')) {
        setError('Insufficient funds for gas');
      } else if (errorMessage.includes('burn amount exceeds balance')) {
        setError('Withdrawal amount exceeds your deposit');
      } else {
        setError(errorMessage);
      }
      setStep('error');
    }
  }, [address, vaultAddress, isSupported, writeContractAsync]);

  return {
    withdraw,
    step,
    error,
    txHash,
    reset,
    isSupported,
    userShares,
    refetchShares,
  };
}
