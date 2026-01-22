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
import { ProtocolData } from '@/hooks/useProtocolData';
import { useAaveDeposit, DepositStep } from '@/hooks/useAaveDeposit';
import { AlertCircle, TrendingUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: ProtocolData | null;
  onConfirm: (amount: number) => void;
  maxAmount?: number;
}

const stepMessages: Record<DepositStep, string> = {
  idle: '',
  checking: 'Checking allowance...',
  approving: 'Please approve EURC spending in your wallet...',
  waitingApproval: 'Waiting for approval confirmation...',
  supplying: 'Please confirm the deposit in your wallet...',
  waitingSupply: 'Waiting for deposit confirmation...',
  success: 'Deposit successful!',
  error: 'Transaction failed',
};

export function DepositModal({ open, onOpenChange, protocol, onConfirm, maxAmount = 0 }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [uiStep, setUiStep] = useState<'input' | 'confirm' | 'processing'>('input');
  
  const { deposit, step: txStep, error: txError, reset: resetTx, supplyTxHash } = useAaveDeposit();

  // Handle transaction completion
  useEffect(() => {
    if (txStep === 'success') {
      // Delay before closing to show success message
      const timer = setTimeout(() => {
        onConfirm(parseFloat(amount) || 0);
        handleClose(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [txStep, amount, onConfirm]);

  if (!protocol) return null;

  const numericAmount = parseFloat(amount) || 0;
  const dailyYield = (numericAmount * (protocol.apy / 100)) / 365;
  const monthlyYield = dailyYield * 30;

  const handleMax = () => {
    setAmount(maxAmount.toString());
  };

  const handleConfirm = async () => {
    if (uiStep === 'input') {
      setUiStep('confirm');
    } else if (uiStep === 'confirm') {
      // Only Aave is supported for now
      if (protocol.id === 'aave') {
        setUiStep('processing');
        await deposit(numericAmount);
      } else {
        // For other protocols, just call the callback (mock)
        onConfirm(numericAmount);
        handleClose(false);
      }
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setUiStep('input');
      resetTx();
    }
    onOpenChange(isOpen);
  };

  const handleRetry = () => {
    resetTx();
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
            {uiStep === 'input' && `Deposit to ${protocol.name}`}
            {uiStep === 'confirm' && 'Confirm Deposit'}
            {uiStep === 'processing' && (isSuccess ? 'Success!' : isError ? 'Error' : 'Processing...')}
          </DialogTitle>
          <DialogDescription>
            {uiStep === 'input' && 'Enter the amount of EURC you want to deposit'}
            {uiStep === 'confirm' && 'Please review your deposit details'}
            {uiStep === 'processing' && stepMessages[txStep]}
          </DialogDescription>
        </DialogHeader>

        {uiStep === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount (EURC)</Label>
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
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  max={maxAmount}
                />
              </div>
              {numericAmount > maxAmount && maxAmount > 0 && (
                <p className="text-xs text-destructive">Amount exceeds your balance</p>
              )}
            </div>

            {numericAmount > 0 && (
              <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-muted-foreground">Estimated earnings</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Per day</p>
                    <p className="font-semibold text-success">+€{dailyYield.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Per month</p>
                    <p className="font-semibold text-success">+€{monthlyYield.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
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
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">€{numericAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current APY</span>
                <span className="font-medium text-success">{protocol.apy.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. monthly yield</span>
                <span className="font-medium text-success">+€{monthlyYield.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5" />
              <p className="text-muted-foreground">
                {protocol.id === 'aave' 
                  ? 'This will require 1-2 transactions: approval (if needed) and deposit. Gas fees apply.'
                  : 'This will require a transaction approval in your wallet. Gas fees apply.'}
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
                <p className="text-center font-medium">Deposit successful!</p>
                <p className="text-sm text-muted-foreground">
                  €{numericAmount.toLocaleString()} deposited to {protocol.name}
                </p>
                {supplyTxHash && (
                  <a 
                    href={`https://etherscan.io/tx/${supplyTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View on Etherscan →
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
                Confirm Deposit
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
