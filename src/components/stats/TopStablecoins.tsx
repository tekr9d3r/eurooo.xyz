import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { EURStablecoin } from '@/hooks/useStablecoinStats';

interface TopStablecoinsProps {
  stablecoins: EURStablecoin[];
  isLoading: boolean;
}

function formatSupply(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value.toLocaleString()}`;
}

export function TopStablecoins({ stablecoins, isLoading }: TopStablecoinsProps) {
  // Show top 15
  const displayTokens = stablecoins.slice(0, 15);

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container px-4">
          <h2 className="text-2xl font-semibold mb-6">Top Stablecoins by Market Cap</h2>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container px-4">
        <h2 className="text-2xl font-semibold mb-6">Top Stablecoins by Market Cap</h2>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Symbol</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Supply</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Share</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Chains</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTokens.map((token, index) => (
                    <tr key={token.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="p-4 font-medium">{token.symbol}</td>
                      <td className="p-4 text-muted-foreground">{token.name}</td>
                      <td className="p-4 text-right font-medium">{formatSupply(token.circulating)}</td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {token.marketShare.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {token.chains.slice(0, 3).map((chain) => (
                            <Badge key={chain} variant="secondary" className="text-xs">
                              {chain}
                            </Badge>
                          ))}
                          {token.chains.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{token.chains.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {displayTokens.map((token, index) => (
                <div key={token.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                      <div>
                        <p className="font-medium">{token.symbol}</p>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatSupply(token.circulating)}</p>
                      <span className="text-xs text-primary">{token.marketShare.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-9">
                    {token.chains.slice(0, 4).map((chain) => (
                      <Badge key={chain} variant="secondary" className="text-xs">
                        {chain}
                      </Badge>
                    ))}
                    {token.chains.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{token.chains.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
