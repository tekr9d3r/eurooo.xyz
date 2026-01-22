import { useState } from 'react';
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
import { Protocol } from './ProtocolCard';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: Protocol | null;
  onConfirm: (amount: number) => void;
}

export function DepositModal({ open, onOpenChange, protocol, onConfirm }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  if (!protocol) return null;

  const numericAmount = parseFloat(amount) || 0;
  const dailyYield = (numericAmount * (protocol.apy / 100)) / 365;
  const monthlyYield = dailyYield * 30;

  const handleConfirm = () => {
    if (step === 'input') {
      setStep('confirm');
    } else {
      onConfirm(numericAmount);
      setAmount('');
      setStep('input');
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setStep('input');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' ? `Deposit to ${protocol.name}` : 'Confirm Deposit'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Enter the amount of EURC you want to deposit'
              : 'Please review your deposit details'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (EURC)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
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
        ) : (
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
                This will require a transaction approval in your wallet. 
                Gas fees apply on the selected network.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'confirm' && (
            <Button variant="outline" onClick={() => setStep('input')}>
              Back
            </Button>
          )}
          <Button 
            onClick={handleConfirm}
            disabled={numericAmount <= 0}
            className="bg-primary hover:bg-primary/90"
          >
            {step === 'input' ? 'Continue' : 'Confirm Deposit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
