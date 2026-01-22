import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface YieldCounterProps {
  totalDeposit: number;
  averageApy: number;
  isLoading?: boolean;
}

export function YieldCounter({ totalDeposit, averageApy, isLoading }: YieldCounterProps) {
  const [displayValue, setDisplayValue] = useState(totalDeposit);
  const [earnedToday, setEarnedToday] = useState(0);

  // Calculate yield per second based on APY
  const yieldPerSecond = (totalDeposit * (averageApy / 100)) / (365 * 24 * 60 * 60);
  const dailyYield = (totalDeposit * (averageApy / 100)) / 365;

  useEffect(() => {
    // Reset display value when deposit changes
    setDisplayValue(totalDeposit);
    setEarnedToday(0);
  }, [totalDeposit]);

  useEffect(() => {
    if (totalDeposit <= 0 || averageApy <= 0) return;

    const interval = setInterval(() => {
      setDisplayValue((prev) => prev + yieldPerSecond);
      setEarnedToday((prev) => {
        const newValue = prev + yieldPerSecond;
        // Reset at midnight (simplified - just caps at daily yield)
        return newValue > dailyYield ? 0 : newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDeposit, yieldPerSecond, dailyYield, averageApy]);

  // Show empty state if no deposits
  if (!isLoading && totalDeposit <= 0) {
    return (
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Your Portfolio</h2>
        </div>

        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">No deposits yet</p>
          <p className="text-sm text-muted-foreground">
            Deposit EURC into a protocol to start earning yield
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <h2 className="text-lg font-semibold">Your Portfolio</h2>
      </div>

      {/* Main balance */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
        {isLoading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight yield-glow text-success">
              €{displayValue.toLocaleString('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Earning today</p>
          {isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="text-lg font-semibold text-success">
              +€{earnedToday.toFixed(6)}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Average APY</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <span className="text-lg font-semibold">{averageApy.toFixed(2)}%</span>
          )}
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Per day</p>
          {isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <span className="text-lg font-semibold text-success">
              +€{dailyYield.toFixed(4)}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Per year (est.)</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <span className="text-lg font-semibold text-success">
              +€{(dailyYield * 365).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
