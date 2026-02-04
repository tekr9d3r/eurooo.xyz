import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TokenData } from '@/hooks/useStablecoinStats';

interface TopStablecoinsProps {
  tokens: TokenData[];
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

export function TopStablecoins({ tokens, isLoading }: TopStablecoinsProps) {
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container px-4">
          <h2 className="text-2xl font-semibold mb-6">Top Stablecoins by Supply</h2>
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
        <h2 className="text-2xl font-semibold mb-6">Top Stablecoins by Supply</h2>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ticker</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Issuer</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Supply</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, index) => (
                    <tr key={token.ticker} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                      <td className="p-4 font-medium">{token.ticker}</td>
                      <td className="p-4 text-muted-foreground">{token.issuer}</td>
                      <td className="p-4 text-right font-medium">{formatSupply(token.supply)}</td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {token.marketShare.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {tokens.map((token, index) => (
                <div key={token.ticker} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                    <div>
                      <p className="font-medium">{token.ticker}</p>
                      <p className="text-sm text-muted-foreground">{token.issuer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatSupply(token.supply)}</p>
                    <span className="text-xs text-primary">{token.marketShare.toFixed(1)}%</span>
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
