import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  YO_VAULT_ADDRESSES,
  YO_GATEWAY_ADDRESSES,
  ERC20_ABI,
  YO_GATEWAY_ABI,
} from '@/lib/contracts';

export type YoDepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

// Partner ID for YO attribution (0 = no partner)
const YO_PARTNER_ID = 0n;

export function useYoDeposit() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<YoDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const vaultAddress = YO_VAULT_ADDRESSES[chainId as keyof typeof YO_VAULT_ADDRESSES];
  const gatewayAddress = YO_GATEWAY_ADDRESSES[chainId as keyof typeof YO_GATEWAY_ADDRESSES];

  const { writeContractAsync } = useWriteContract();

  // Check current allowance for gateway
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: eurcAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && gatewayAddress ? [address, gatewayAddress] : undefined,
    query: {
      enabled: !!address && !!eurcAddress && !!gatewayAddress,
    },
  });

  // Quote for preview
  const { data: quotedShares } = useReadContract({
    address: gatewayAddress,
    abi: YO_GATEWAY_ABI,
    functionName: 'quotePreviewDeposit',
    args: vaultAddress ? [vaultAddress, parseUnits('1', 6)] : undefined,
    query: {
      enabled: !!vaultAddress && !!gatewayAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !eurcAddress || !vaultAddress || !gatewayAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    try {
      setError(null);
      setStep('checking');

      const amountInUnits = parseUnits(amount.toString(), 6);

      // Check if we need approval for gateway
      await refetchAllowance();
      const needsApproval = !currentAllowance || currentAllowance < amountInUnits;

      if (needsApproval) {
        setStep('approving');
        
        const approveTx = await writeContractAsync({
          address: eurcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gatewayAddress, amountInUnits],
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

      // Deposit via YO Gateway
      setStep('depositing');

      // Calculate min shares with 1% slippage tolerance
      const minSharesOut = quotedShares 
        ? (quotedShares * amountInUnits * 99n) / (parseUnits('1', 6) * 100n)
        : 0n;

      const depositTx = await writeContractAsync({
        address: gatewayAddress,
        abi: YO_GATEWAY_ABI,
        functionName: 'deposit',
        args: [vaultAddress, amountInUnits, minSharesOut, address, YO_PARTNER_ID],
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
  }, [address, eurcAddress, vaultAddress, gatewayAddress, currentAllowance, quotedShares, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    txHash,
    isSupported: !!vaultAddress && !!gatewayAddress,
  };
}
