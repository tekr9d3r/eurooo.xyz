import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { ProtocolData } from '@/hooks/useProtocolData';
import { useAaveWithdraw, WithdrawStep as AaveWithdrawStep } from '@/hooks/useAaveWithdraw';
import { useSummerWithdraw, SummerWithdrawStep } from '@/hooks/useSummerWithdraw';
import { useYoWithdraw, YoWithdrawStep } from '@/hooks/useYoWithdraw';
import { useMorphoWithdraw, MorphoWithdrawStep } from '@/hooks/useMorphoWithdraw';
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: ProtocolData | null;
  onComplete: () => void;
}

type UnifiedStep = 'idle' | 'withdrawing' | 'waitingWithdraw' | 'success' | 'error';

const stepMessages: Record<UnifiedStep, string> = {
  idle: '',
  withdrawing: 'Please confirm the withdrawal in your wallet...',
  waitingWithdraw: 'Waiting for withdrawal confirmation...',
  success: 'Withdrawal successful!',
  error: 'Transaction failed',
};

const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
};

export function WithdrawModal({ open, onOpenChange, protocol, onComplete }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [uiStep, setUiStep] = useState<'input' | 'confirm' | 'processing'>('input');
  const chainId = useChainId();
  
  const aaveWithdraw = useAaveWithdraw();
  const summerWithdraw = useSummerWithdraw();
  const yoWithdraw = useYoWithdraw();
  const morphoGauntletWithdraw = useMorphoWithdraw('morpho-gauntlet');

  const blockExplorer = BLOCK_EXPLORERS[chainId] || 'https://etherscan.io';

  // Get the active withdraw hook based on protocol
  const getActiveWithdraw = () => {
    if (!protocol) return null;
    switch (protocol.id) {
      case 'aave': 
        return { 
          ...aaveWithdraw, 
          step: aaveWithdraw.step as UnifiedStep, 
          txHash: aaveWithdraw.withdrawTxHash 
        };
      case 'summer': 
        return { 
          ...summerWithdraw, 
          step: summerWithdraw.step as UnifiedStep 
        };
      case 'yo': 
        return { 
          ...yoWithdraw, 
          step: yoWithdraw.step as UnifiedStep 
        };
      case 'morpho-gauntlet': 
        return { 
          ...morphoGauntletWithdraw, 
          step: morphoGauntletWithdraw.step as UnifiedStep 
        };
      default: return null;
    }
  };

  const activeWithdraw = getActiveWithdraw();
  const txStep = activeWithdraw?.step || 'idle';
  const txError = activeWithdraw?.error;
  const txHash = activeWithdraw?.txHash;

  // Handle transaction completion
  useEffect(() => {
    if (txStep === 'success') {
      const timer = setTimeout(() => {
        onComplete();
        handleClose(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [txStep, onComplete]);

  if (!protocol) return null;

  const numericAmount = parseFloat(amount) || 0;
  const maxAmount = protocol.userDeposit || 0;

  const handleMax = () => {
    setAmount(maxAmount.toString());
  };

  const handleConfirm = async () => {
    if (uiStep === 'input') {
      setUiStep('confirm');
    } else if (uiStep === 'confirm') {
      setUiStep('processing');
      const isWithdrawAll = numericAmount >= maxAmount * 0.999; // Account for rounding
      
      // Convert amount to shares (simplified - assumes 1:1 for now)
      const amountInUnits = parseUnits(numericAmount.toString(), 6);
      
      switch (protocol.id) {
        case 'aave':
          await aaveWithdraw.withdraw(numericAmount, isWithdrawAll);
          break;
        case 'summer':
          await summerWithdraw.withdraw(amountInUnits, isWithdrawAll);
          break;
        case 'yo':
          // For YO we withdraw by assets; if withdrawing all, use the exact max to avoid rounding reverts.
          await yoWithdraw.withdraw(isWithdrawAll ? parseUnits(maxAmount.toString(), 6) : amountInUnits);
          break;
        case 'morpho-gauntlet':
          await morphoGauntletWithdraw.withdraw(amountInUnits);
          break;
        default:
          onComplete();
          handleClose(false);
      }
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setUiStep('input');
      aaveWithdraw.reset();
      summerWithdraw.reset();
      yoWithdraw.reset();
      morphoGauntletWithdraw.reset();
    }
    onOpenChange(isOpen);
  };

  const handleRetry = () => {
    aaveWithdraw.reset();
    summerWithdraw.reset();
    yoWithdraw.reset();
    morphoGauntletWithdraw.reset();
    setUiStep('confirm');
  };

  const isProcessing = uiStep === 'processing' && txStep !== 'success' && txStep !== 'error';
  const isSuccess = txStep === 'success';
  const isError = txStep === 'error';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {uiStep === 'input' && `Withdraw from ${protocol.name}`}
            {uiStep === 'confirm' && 'Confirm Withdrawal'}
            {uiStep === 'processing' && (isSuccess ? 'Success!' : isError ? 'Error' : 'Processing...')}
          </DialogTitle>
          <DialogDescription>
            {uiStep === 'input' && 'Enter the amount you want to withdraw'}
            {uiStep === 'confirm' && 'Please review your withdrawal details'}
            {uiStep === 'processing' && stepMessages[txStep]}
          </DialogDescription>
        </DialogHeader>

        {uiStep === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="withdraw-amount">Amount (EURC)</Label>
                {maxAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleMax}
                    className="text-xs text-primary hover:underline"
                  >
                    Max: €{maxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  max={maxAmount}
                />
              </div>
              {numericAmount > maxAmount && maxAmount > 0 && (
                <p className="text-xs text-destructive">Amount exceeds your deposit</p>
              )}
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Your current deposit</p>
              <p className="text-lg font-semibold">
                €{maxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {uiStep === 'confirm' && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Protocol</span>
                <span className="font-medium">{protocol.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdraw amount</span>
                <span className="font-medium">€{numericAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining deposit</span>
                <span className="font-medium">
                  €{Math.max(0, maxAmount - numericAmount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5" />
              <p className="text-muted-foreground">
                This will require a transaction in your wallet. Gas fees apply.
              </p>
            </div>
          </div>
        )}

        {uiStep === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            {isProcessing && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">{stepMessages[txStep]}</p>
              </>
            )}
            
            {isSuccess && (
              <>
                <CheckCircle2 className="h-12 w-12 text-success" />
                <p className="text-center font-medium">Withdrawal successful!</p>
                <p className="text-sm text-muted-foreground">
                  €{numericAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} withdrawn from {protocol.name}
                </p>
                {txHash && (
                  <a 
                    href={`${blockExplorer}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View transaction →
                  </a>
                )}
              </>
            )}
            
            {isError && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center font-medium">Transaction failed</p>
                <p className="text-sm text-muted-foreground text-center">
                  {txError || 'Something went wrong. Please try again.'}
                </p>
              </>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {uiStep === 'input' && (
            <Button 
              onClick={handleConfirm}
              disabled={numericAmount <= 0 || (maxAmount > 0 && numericAmount > maxAmount)}
              className="bg-primary hover:bg-primary/90"
            >
              Continue
            </Button>
          )}
          
          {uiStep === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setUiStep('input')}>
                Back
              </Button>
              <Button 
                onClick={handleConfirm}
                className="bg-primary hover:bg-primary/90"
              >
                Confirm Withdrawal
              </Button>
            </>
          )}
          
          {uiStep === 'processing' && isError && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
