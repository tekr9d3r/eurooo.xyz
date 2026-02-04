import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsHeroProps {
  totalSupply: number | null;
  change30d: number | null;
  lastUpdated: Date | null;
  isLoading: boolean;
}

function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(2)}M`;
  }
  return `€${value.toLocaleString()}`;
}

export function StatsHero({ totalSupply, change30d, lastUpdated, isLoading }: StatsHeroProps) {
  const isPositive = (change30d ?? 0) >= 0;
  
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Euro Stablecoin Stats
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time data on EUR-denominated stablecoins, their market cap, and chain distribution.
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* Total Supply */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-36 mx-auto" />
                ) : (
                  <p className="text-3xl md:text-4xl font-bold text-primary">
                    {totalSupply !== null ? formatSupply(totalSupply) : '—'}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="sm:hidden w-24 h-px bg-border" />

              {/* 30-Day Change */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">30-Day Change</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-24 mx-auto" />
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <p className={`text-2xl md:text-3xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {change30d !== null ? `${isPositive ? '+' : ''}${change30d.toFixed(2)}%` : '—'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {lastUpdated && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Updated: {lastUpdated.toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a
            href="https://defillama.com/stablecoins?pegtype=PEGGEDEUR"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Data: DefiLlama Stablecoins
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
