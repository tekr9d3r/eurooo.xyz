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
import { useChainId, useSwitchChain } from 'wagmi';
import { ProtocolData } from '@/hooks/useProtocolData';
import { useAaveDeposit, DepositStep as AaveDepositStep } from '@/hooks/useAaveDeposit';
import { useSummerDeposit, SummerDepositStep } from '@/hooks/useSummerDeposit';
import { useYoDeposit, YoDepositStep } from '@/hooks/useYoDeposit';
import { useMorphoDeposit, MorphoDepositStep } from '@/hooks/useMorphoDeposit';
import { useFluidDeposit, FluidDepositStep } from '@/hooks/useFluidDeposit';
import { MorphoVaultId } from '@/hooks/useMorphoData';
import { AlertCircle, TrendingUp, Loader2, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';

const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  100: 'https://gnosisscan.io',
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  100: 'Gnosis',
};

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: ProtocolData | null;
  onConfirm: () => void;
  maxAmount?: number;
}

type UnifiedStep = 'idle' | 'checking' | 'approving' | 'waitingApproval' | 'depositing' | 'waitingDeposit' | 'success' | 'error';

function mapAaveStep(step: AaveDepositStep): UnifiedStep {
  const map: Record<AaveDepositStep, UnifiedStep> = {
    idle: 'idle',
    checking: 'checking',
    approving: 'approving',
    waitingApproval: 'waitingApproval',
    supplying: 'depositing',
    waitingSupply: 'waitingDeposit',
    success: 'success',
    error: 'error',
  };
  return map[step];
}

function mapSummerStep(step: SummerDepositStep): UnifiedStep {
  const map: Record<SummerDepositStep, UnifiedStep> = {
    idle: 'idle',
    checking: 'checking',
    approving: 'approving',
    waitingApproval: 'waitingApproval',
    depositing: 'depositing',
    waitingDeposit: 'waitingDeposit',
    success: 'success',
    error: 'error',
  };
  return map[step];
}

function mapYoStep(step: YoDepositStep): UnifiedStep {
  return mapSummerStep(step as SummerDepositStep);
}

function mapMorphoStep(step: MorphoDepositStep): UnifiedStep {
  return mapSummerStep(step as SummerDepositStep);
}

function mapFluidStep(step: FluidDepositStep): UnifiedStep {
  return mapSummerStep(step as SummerDepositStep);
}

// Get the token name based on protocol
function getTokenName(protocol: ProtocolData | null): string {
  if (!protocol) return 'EURC';
  // Use the stablecoin field directly - supports EURC, EURe, EURCV
  if (protocol.stablecoin === 'EURe') return 'EURe';
  if (protocol.stablecoin === 'EURCV') return 'EURCV';
  return 'EURC';
}

const getStepMessages = (tokenName: string): Record<UnifiedStep, string> => ({
  idle: '',
  checking: 'Checking allowance...',
  approving: `Please approve ${tokenName} spending in your wallet...`,
  waitingApproval: 'Waiting for approval confirmation...',
  depositing: 'Please confirm the deposit in your wallet...',
  waitingDeposit: 'Waiting for deposit confirmation...',
  success: 'Deposit successful!',
  error: 'Transaction failed',
});

export function DepositModal({ open, onOpenChange, protocol, onConfirm, maxAmount = 0 }: DepositModalProps) {
  const [amount, setAmount] = useState('');
  const [uiStep, setUiStep] = useState<'input' | 'confirm' | 'processing'>('input');
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  const aaveDeposit = useAaveDeposit();
  const summerDeposit = useSummerDeposit();
  const yoDeposit = useYoDeposit();
  const morphoGauntletDeposit = useMorphoDeposit('morpho-gauntlet');
  const morphoPrimeDeposit = useMorphoDeposit('morpho-prime');
  const morphoKpkDeposit = useMorphoDeposit('morpho-kpk');
  const morphoMoonwellDeposit = useMorphoDeposit('morpho-moonwell');
  const morphoSteakhouseDeposit = useMorphoDeposit('morpho-steakhouse');
  const morphoSteakhousePrimeDeposit = useMorphoDeposit('morpho-steakhouse-prime');
  const fluidDeposit = useFluidDeposit();
  
  // Determine token name for this protocol
  const tokenName = getTokenName(protocol);
  
  const blockExplorer = protocol?.chainId ? (BLOCK_EXPLORERS[protocol.chainId] || 'https://etherscan.io') : 'https://etherscan.io';
  
  // Check if user is on the correct network for this protocol
  const isOnCorrectNetwork = protocol ? chainId === protocol.chainId : false;
  const requiredChainName = protocol?.chainId ? (CHAIN_NAMES[protocol.chainId] || 'Unknown') : 'Unknown';

  // Get the active deposit hook based on protocol
  const getActiveDeposit = () => {
    if (!protocol) return null;
    switch (protocol.id) {
      case 'aave-ethereum':
      case 'aave-base':
      case 'aave-gnosis':
        return { ...aaveDeposit, step: mapAaveStep(aaveDeposit.step), txHash: aaveDeposit.supplyTxHash };
      case 'summer': return { ...summerDeposit, step: mapSummerStep(summerDeposit.step) };
      case 'yo': return { ...yoDeposit, step: mapYoStep(yoDeposit.step) };
      case 'morpho-gauntlet': return { ...morphoGauntletDeposit, step: mapMorphoStep(morphoGauntletDeposit.step) };
      case 'morpho-prime': return { ...morphoPrimeDeposit, step: mapMorphoStep(morphoPrimeDeposit.step) };
      case 'morpho-kpk': return { ...morphoKpkDeposit, step: mapMorphoStep(morphoKpkDeposit.step) };
      case 'morpho-moonwell': return { ...morphoMoonwellDeposit, step: mapMorphoStep(morphoMoonwellDeposit.step) };
      case 'morpho-steakhouse': return { ...morphoSteakhouseDeposit, step: mapMorphoStep(morphoSteakhouseDeposit.step) };
      case 'morpho-steakhouse-prime': return { ...morphoSteakhousePrimeDeposit, step: mapMorphoStep(morphoSteakhousePrimeDeposit.step) };
      case 'fluid': return { ...fluidDeposit, step: mapFluidStep(fluidDeposit.step) };
      default: return null;
    }
  };

  const activeDeposit = getActiveDeposit();
  const txStep = activeDeposit?.step || 'idle';
  const txError = activeDeposit?.error;
  const txHash = activeDeposit?.txHash;

  // Handle transaction completion
  useEffect(() => {
    if (txStep === 'success') {
      const timer = setTimeout(() => {
        onConfirm();
        handleClose(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [txStep, onConfirm]);

  if (!protocol) return null;

  const numericAmount = parseFloat(amount) || 0;
  const dailyYield = (numericAmount * (protocol.apy / 100)) / 365;
  const monthlyYield = dailyYield * 30;

  const handleMax = () => {
    setAmount(maxAmount.toString());
  };

  const handleSwitchNetwork = () => {
    if (protocol?.chainId) {
      switchChain({ chainId: protocol.chainId as 1 | 8453 | 100 });
    }
  };

  const handleConfirm = async () => {
    if (!isOnCorrectNetwork) return;
    
    if (uiStep === 'input') {
      setUiStep('confirm');
    } else if (uiStep === 'confirm') {
      setUiStep('processing');
      
      switch (protocol.id) {
        case 'aave-ethereum':
        case 'aave-base':
        case 'aave-gnosis':
          await aaveDeposit.deposit(numericAmount);
          break;
        case 'summer':
          await summerDeposit.deposit(numericAmount);
          break;
        case 'yo':
          await yoDeposit.deposit(numericAmount);
          break;
        case 'morpho-gauntlet':
          await morphoGauntletDeposit.deposit(numericAmount);
          break;
        case 'morpho-prime':
          await morphoPrimeDeposit.deposit(numericAmount);
          break;
        case 'morpho-kpk':
          await morphoKpkDeposit.deposit(numericAmount);
          break;
        case 'morpho-moonwell':
          await morphoMoonwellDeposit.deposit(numericAmount);
          break;
        case 'morpho-steakhouse':
          await morphoSteakhouseDeposit.deposit(numericAmount);
          break;
        case 'morpho-steakhouse-prime':
          await morphoSteakhousePrimeDeposit.deposit(numericAmount);
          break;
        case 'fluid':
          await fluidDeposit.deposit(numericAmount);
          break;
        default:
          onConfirm();
          handleClose(false);
      }
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setUiStep('input');
      aaveDeposit.reset();
      summerDeposit.reset();
      yoDeposit.reset();
      morphoGauntletDeposit.reset();
      morphoPrimeDeposit.reset();
      morphoKpkDeposit.reset();
      morphoMoonwellDeposit.reset();
      morphoSteakhouseDeposit.reset();
      morphoSteakhousePrimeDeposit.reset();
      fluidDeposit.reset();
    }
    onOpenChange(isOpen);
  };

  const handleRetry = () => {
    aaveDeposit.reset();
    summerDeposit.reset();
    yoDeposit.reset();
    morphoGauntletDeposit.reset();
    morphoPrimeDeposit.reset();
    morphoKpkDeposit.reset();
    morphoMoonwellDeposit.reset();
    morphoSteakhouseDeposit.reset();
    morphoSteakhousePrimeDeposit.reset();
    fluidDeposit.reset();
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
            {uiStep === 'input' && `Enter the amount of ${tokenName} you want to deposit`}
            {uiStep === 'confirm' && 'Please review your deposit details'}
            {uiStep === 'processing' && getStepMessages(tokenName)[txStep]}
          </DialogDescription>
        </DialogHeader>

        {uiStep === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount ({tokenName})</Label>
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
                This will require 1-2 transactions: approval (if needed) and deposit. Gas fees apply.
              </p>
            </div>
          </div>
        )}

        {uiStep === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            {isProcessing && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">{getStepMessages(tokenName)[txStep]}</p>
              </>
            )}
            
            {isSuccess && (
              <>
                <CheckCircle2 className="h-12 w-12 text-success" />
                <p className="text-center font-medium">Deposit successful!</p>
                <p className="text-sm text-muted-foreground">
                  €{numericAmount.toLocaleString()} deposited to {protocol.name}
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
          {uiStep === 'input' && !isOnCorrectNetwork && (
            <Button 
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              {isSwitching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Switch to {requiredChainName}
                </>
              )}
            </Button>
          )}
          
          {uiStep === 'input' && isOnCorrectNetwork && (
            <Button 
              onClick={handleConfirm}
              disabled={numericAmount <= 0 || (maxAmount > 0 && numericAmount > maxAmount)}
              className="bg-primary hover:bg-primary/90"
            >
              Continue
            </Button>
          )}
          
          {uiStep === 'confirm' && !isOnCorrectNetwork && (
            <Button 
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              {isSwitching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Switch to {requiredChainName}
                </>
              )}
            </Button>
          )}
          
          {uiStep === 'confirm' && isOnCorrectNetwork && (
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
