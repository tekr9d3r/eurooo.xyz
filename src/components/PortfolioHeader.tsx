import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PortfolioHeaderProps {
  totalDeposits: number;
  averageApy: number;
  isLoading?: boolean;
}

export function PortfolioHeader({ 
  totalDeposits, 
  averageApy, 
  isLoading 
}: PortfolioHeaderProps) {
  const [displayValue, setDisplayValue] = useState(totalDeposits);

  // Calculate yield per second based on APY
  const yieldPerSecond = (totalDeposits * (averageApy / 100)) / (365 * 24 * 60 * 60);
  const dailyYield = (totalDeposits * (averageApy / 100)) / 365;
  const yearlyYield = totalDeposits * (averageApy / 100);

  useEffect(() => {
    setDisplayValue(totalDeposits);
  }, [totalDeposits]);

  useEffect(() => {
    if (totalDeposits <= 0 || averageApy <= 0) return;

    const interval = setInterval(() => {
      setDisplayValue((prev) => prev + yieldPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDeposits, yieldPerSecond, averageApy]);

  const hasDeposits = totalDeposits > 0;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 md:p-6 mb-6">
      {!hasDeposits && !isLoading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No deposits yet</p>
          <p className="text-sm text-muted-foreground">Deposit EURC to start earning yield</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          {/* Portfolio Balance - Primary focus on mobile */}
          <div className="text-center md:text-left w-full md:w-auto">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Portfolio</p>
            {isLoading ? (
              <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold yield-glow text-success tracking-tight">
                €{displayValue.toLocaleString('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
              </div>
            )}
          </div>

          {/* Compact row for APY and Daily Yield on mobile */}
          {hasDeposits && !isLoading && (
            <div className="flex items-center justify-center gap-4 w-full md:w-auto md:gap-6">
              {/* Average APY */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Average APY</p>
                <Badge variant="secondary" className="text-sm md:text-base px-2 md:px-3 py-0.5 md:py-1">
                  {averageApy.toFixed(2)}%
                </Badge>
              </div>

              <div className="h-8 w-px bg-border" />

              {/* Daily Yield */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Daily Yield</p>
                <div className="flex items-center gap-1 justify-center">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-success" />
                  <span className="text-sm md:text-lg font-semibold text-success">
                    +€{dailyYield.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </span>
                </div>
              </div>
              
              {/* Yearly Yield - Hidden on mobile */}
              <div className="hidden md:block h-8 w-px bg-border" />
              
              <div className="hidden md:block text-center">
                <p className="text-xs text-muted-foreground mb-1">Yearly Yield</p>
                <div className="flex items-center gap-1 justify-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-lg font-semibold text-success">
                    +€{yearlyYield.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
