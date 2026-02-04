import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStablecoinStats } from '@/hooks/useStablecoinStats';

function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  return `€${value.toLocaleString()}`;
}

export function StatsPreview() {
  const { data, isLoading } = useStablecoinStats();
  
  const leader = data?.stablecoins[0];
  const isPositive = (data?.change30d ?? 0) >= 0;

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-4xl">
          {/* Section header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-sm mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">EUR Stablecoin Market</span>
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl mb-3">
              Track the Euro Stablecoin Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Real-time data on EUR stablecoin supply, market share, and blockchain distribution.
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            {/* Total Supply */}
            <Card className="text-center">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground mb-1">Total EUR Supply</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-28 mx-auto" />
                ) : (
                  <p className="text-3xl font-bold text-primary">
                    {data?.totalSupply ? formatSupply(data.totalSupply) : '—'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 30-Day Change */}
            <Card className="text-center">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground mb-1">30-Day Growth</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24 mx-auto" />
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                    <p className={`text-3xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {data?.change30d !== undefined ? `${isPositive ? '+' : ''}${data.change30d.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Leader */}
            <Card className="text-center">
              <CardContent className="pt-6 pb-6">
                <p className="text-sm text-muted-foreground mb-1">Market Leader</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-32 mx-auto" />
                ) : leader ? (
                  <p className="text-3xl font-bold">
                    <span className="text-foreground">{leader.symbol}</span>
                    <span className="text-muted-foreground text-lg ml-2">
                      {leader.marketShare.toFixed(0)}%
                    </span>
                  </p>
                ) : (
                  <p className="text-3xl font-bold">—</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/stats">
                View Full Market Stats
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
