import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';

interface StatsHeroProps {
  totalSupply: number | null;
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

export function StatsHero({ totalSupply, lastUpdated, isLoading }: StatsHeroProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Euro Stablecoin Stats
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive data on EUR-denominated stablecoins, their issuers, and market distribution.
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Total EUR Stablecoin Supply</p>
            {isLoading ? (
              <Skeleton className="h-12 w-48 mx-auto mb-2" />
            ) : (
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {totalSupply !== null ? formatSupply(totalSupply) : '—'}
              </p>
            )}
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a
            href="https://github.com/roinevirta/euro-stablecoin-research"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Data: roinevirta/euro-stablecoin-research
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
