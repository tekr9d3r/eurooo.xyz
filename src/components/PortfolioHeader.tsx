import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioHeaderProps {
  eurcBalance: number;
  totalDeposits: number;
  averageApy: number;
  isLoading?: boolean;
}

export function PortfolioHeader({ 
  eurcBalance, 
  totalDeposits, 
  averageApy, 
  isLoading 
}: PortfolioHeaderProps) {
  const [displayValue, setDisplayValue] = useState(totalDeposits);
  const [earnedToday, setEarnedToday] = useState(0);

  // Calculate yield per second based on APY
  const yieldPerSecond = (totalDeposits * (averageApy / 100)) / (365 * 24 * 60 * 60);
  const dailyYield = (totalDeposits * (averageApy / 100)) / 365;

  useEffect(() => {
    setDisplayValue(totalDeposits);
    setEarnedToday(0);
  }, [totalDeposits]);

  useEffect(() => {
    if (totalDeposits <= 0 || averageApy <= 0) return;

    const interval = setInterval(() => {
      setDisplayValue((prev) => prev + yieldPerSecond);
      setEarnedToday((prev) => {
        const newValue = prev + yieldPerSecond;
        return newValue > dailyYield ? 0 : newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDeposits, yieldPerSecond, dailyYield, averageApy]);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <span className="text-2xl font-bold">
                €{eurcBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available to deposit</p>
          </div>
        </div>

        {/* Total Deposited */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <PiggyBank className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Deposited</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : totalDeposits > 0 ? (
              <span className="text-2xl font-bold yield-glow text-success">
                €{displayValue.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </span>
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">€0.00</span>
            )}
            {averageApy > 0 && totalDeposits > 0 && (
              <p className="text-xs text-success mt-1">{averageApy.toFixed(2)}% APY</p>
            )}
          </div>
        </div>

        {/* Daily Earnings */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Earning Today</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : totalDeposits > 0 ? (
              <span className="text-2xl font-bold text-success">
                +€{earnedToday.toFixed(6)}
              </span>
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">—</span>
            )}
            {dailyYield > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                ~€{dailyYield.toFixed(4)}/day
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
