import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import {
  MORPHO_VAULT_ADDRESSES,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';
import { MorphoVaultId } from './useMorphoData';

export type MorphoWithdrawStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

export function useMorphoWithdraw(vaultId: MorphoVaultId) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<MorphoWithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = chainId === 1 ? vaultConfig?.[1] : undefined;
  const isSupported = chainId === 1 && !!vaultAddress;

  const { writeContractAsync } = useWriteContract();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const withdraw = useCallback(async (shares: bigint) => {
    if (!address || !vaultAddress) {
      setError('Wallet not connected');
      setStep('error');
      return;
    }

    if (!isSupported) {
      setError('Switch to Ethereum Mainnet to use Morpho');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('withdrawing');

      const withdrawTx = await writeContractAsync({
        address: vaultAddress,
        abi: ERC4626_VAULT_ABI,
        functionName: 'redeem',
        args: [shares, address, address],
        account: address,
        chain: mainnet,
      });

      setTxHash(withdrawTx);
      setStep('waitingWithdraw');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Morpho withdraw error:', e);
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
  }, [address, vaultAddress, isSupported, writeContractAsync]);

  return {
    withdraw,
    step,
    error,
    txHash,
    reset,
    isSupported,
  };
}
