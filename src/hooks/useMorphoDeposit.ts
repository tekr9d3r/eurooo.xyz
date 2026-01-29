import { useState, useCallback } from 'react';
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { mainnet, base } from 'wagmi/chains';
import {
  EURC_ADDRESSES,
  EURCV_ADDRESS,
  MORPHO_VAULT_ADDRESSES,
  ERC20_ABI,
  ERC4626_VAULT_ABI,
} from '@/lib/contracts';
import { MorphoVaultId } from './useMorphoData';

export type MorphoDepositStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

// Map vault IDs to their required chain
const VAULT_CHAIN_IDS: Record<MorphoVaultId, 1 | 8453> = {
  'morpho-gauntlet': 1,
  'morpho-prime': 1,
  'morpho-kpk': 1,
  'morpho-moonwell': 8453,
  'morpho-steakhouse': 8453,
  'morpho-steakhouse-prime': 8453,
};

const CHAIN_CONFIG = {
  1: mainnet,
  8453: base,
} as const;

// Helper to get the correct token address for each vault
function getTokenAddress(vaultId: MorphoVaultId, chainId: number): `0x${string}` | undefined {
  // EURCV Prime uses EURCV token (Ethereum only)
  if (vaultId === 'morpho-prime') {
    return chainId === 1 ? EURCV_ADDRESS : undefined;
  }
  // Other vaults use EURC on their respective chains
  return EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
}

export function useMorphoDeposit(vaultId: MorphoVaultId) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [step, setStep] = useState<MorphoDepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const requiredChainId = VAULT_CHAIN_IDS[vaultId];
  const tokenAddress = getTokenAddress(vaultId, chainId);
  const vaultConfig = MORPHO_VAULT_ADDRESSES[vaultId];
  const vaultAddress = chainId === requiredChainId 
    ? (vaultConfig?.[requiredChainId as keyof typeof vaultConfig] as `0x${string}` | undefined)
    : undefined;
  const isSupported = chainId === requiredChainId && !!vaultAddress && !!tokenAddress;
  const chain = CHAIN_CONFIG[requiredChainId];

  const { writeContractAsync } = useWriteContract();

  // Check current allowance
  const { refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: {
      enabled: isSupported && !!address && !!tokenAddress,
    },
  });

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!address || !tokenAddress || !vaultAddress) {
      setError('Wallet not connected or chain not supported');
      setStep('error');
      return;
    }

    if (!isSupported) {
      const chainName = requiredChainId === 1 ? 'Ethereum' : 'Base';
      setError(`Switch to ${chainName} to use this Morpho vault`);
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
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [vaultAddress, amountInUnits],
          account: address,
          chain,
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
        chain,
      });

      setTxHash(depositTx);
      setStep('waitingDeposit');

      await new Promise(resolve => setTimeout(resolve, 5000));

      setStep('success');
    } catch (e) {
      console.error('Morpho deposit error:', e);
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
  }, [address, tokenAddress, vaultAddress, isSupported, requiredChainId, chain, writeContractAsync, refetchAllowance]);

  return {
    deposit,
    step,
    error,
    reset,
    txHash,
    isSupported,
    requiredChainId,
  };
}
