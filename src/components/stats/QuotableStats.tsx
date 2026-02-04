import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EURStablecoin, ChainBreakdown } from '@/hooks/useStablecoinStats';

interface QuotableStatsProps {
  totalSupply: number | null;
  stablecoins: EURStablecoin[];
  chains: ChainBreakdown[];
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

export function QuotableStats({ 
  totalSupply, 
  stablecoins, 
  chains,
  lastUpdated,
  isLoading 
}: QuotableStatsProps) {
  const leader = stablecoins[0];
  const stablecoinCount = stablecoins.length;
  const chainCount = chains.length;

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="container px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="container px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Key EUR Stablecoin Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground">
              <li>
                • <strong>Total EUR stablecoin supply:</strong>{' '}
                {totalSupply !== null ? formatSupply(totalSupply) : '—'}
              </li>
              {leader && (
                <li>
                  • <strong>Market leader:</strong>{' '}
                  {leader.symbol} with {leader.marketShare.toFixed(1)}% market share
                </li>
              )}
              <li>
                • <strong>Number of EUR stablecoins tracked:</strong> {stablecoinCount}
              </li>
              <li>
                • <strong>Available on:</strong> {chainCount} blockchains
              </li>
            </ul>
            
            {lastUpdated && (
              <p className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} • Data: DefiLlama
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
