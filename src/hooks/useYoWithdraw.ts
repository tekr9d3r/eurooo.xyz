import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import {
  YO_VAULT_ADDRESSES,
  YO_GATEWAY_ADDRESSES,
  ERC20_ABI,
  YO_GATEWAY_ABI,
} from '@/lib/contracts';

export type YoWithdrawStep = 'idle' | 'approving' | 'waitingApproval' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

const YO_PARTNER_ID = 0n;

export function useYoWithdraw() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<YoWithdrawStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const vaultAddress = YO_VAULT_ADDRESSES[chainId as keyof typeof YO_VAULT_ADDRESSES];
  const gatewayAddress = YO_GATEWAY_ADDRESSES[chainId as keyof typeof YO_GATEWAY_ADDRESSES];

  const { writeContractAsync } = useWriteContract();

  // Check current allowance for gateway to spend vault shares
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: vaultAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && gatewayAddress ? [address, gatewayAddress] : undefined,
    query: {
      enabled: !!address && !!vaultAddress && !!gatewayAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const withdraw = useCallback(async (shares: bigint) => {
    if (!address || !vaultAddress || !gatewayAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);

      // Check if we need approval for gateway to spend shares
      await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < shares;

      if (needsApproval) {
        setStep('approving');
        
        await writeContractAsync({
          address: vaultAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gatewayAddress, shares],
          account: address,
          chain: base,
        });

        setStep('waitingApproval');

        // Wait for approval
        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(async () => {
            try {
              const { data: newAllowance } = await refetchAllowance();
              if (newAllowance && newAllowance >= shares) {
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

      setStep('withdrawing');

      // Use 1% slippage for min assets out
      const minAssetsOut = 0n; // For safety, let the gateway handle this

      const redeemTx = await writeContractAsync({
        address: gatewayAddress,
        abi: YO_GATEWAY_ABI,
        functionName: 'redeem',
        args: [vaultAddress, shares, minAssetsOut, address, YO_PARTNER_ID],
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
  }, [address, vaultAddress, gatewayAddress, currentAllowance, writeContractAsync, refetchAllowance]);

  return {
    withdraw,
    step,
    error,
    reset,
    txHash,
    isSupported: !!vaultAddress && !!gatewayAddress,
  };
}
