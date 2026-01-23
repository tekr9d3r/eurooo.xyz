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
    <div className="rounded-xl border border-border/50 bg-card p-8 mb-8">
      <div className="text-center space-y-6">
        {/* Title */}
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Portfolio</p>
        
        {/* Primary: Total Balance with Counter */}
        <div className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-14 w-64 mx-auto" />
          ) : hasDeposits ? (
            <div className="text-5xl font-bold yield-glow text-success tracking-tight">
              €{displayValue.toLocaleString('de-DE', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
            </div>
          ) : (
            <div className="text-5xl font-bold text-muted-foreground">€0.00</div>
          )}
          <p className="text-sm text-muted-foreground">Total Balance</p>
        </div>

        {/* Secondary: Yield Projections */}
        {hasDeposits && !isLoading && (
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xl font-semibold text-success">
                  +€{dailyYield.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per Day</p>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xl font-semibold text-success">
                  +€{yearlyYield.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per Year</p>
            </div>
          </div>
        )}

        {/* Tertiary: APY Badge */}
        {hasDeposits && !isLoading && averageApy > 0 && (
          <div className="pt-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              📊 {averageApy.toFixed(2)}% APY
            </Badge>
          </div>
        )}

        {/* Empty State */}
        {!hasDeposits && !isLoading && (
          <p className="text-sm text-muted-foreground pt-4">
            Deposit EURC to start earning yield
          </p>
        )}
      </div>
    </div>
  );
}
