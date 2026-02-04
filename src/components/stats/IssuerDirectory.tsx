import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { IssuerData } from '@/hooks/useStablecoinStats';

interface IssuerDirectoryProps {
  issuers: IssuerData[];
  isLoading: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  
  let colorClass = 'bg-muted-foreground';
  if (normalizedStatus.includes('live') || normalizedStatus.includes('active')) {
    colorClass = 'bg-success';
  } else if (normalizedStatus.includes('wind') || normalizedStatus.includes('discontinued')) {
    colorClass = 'bg-destructive';
  } else if (normalizedStatus.includes('unknown') || !status) {
    colorClass = 'bg-muted-foreground';
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="text-muted-foreground">{status || 'Unknown'}</span>
    </span>
  );
}

export function IssuerDirectory({ issuers, isLoading }: IssuerDirectoryProps) {
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container px-4">
          <h2 className="text-2xl font-semibold mb-6">Issuer Directory</h2>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (issuers.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container px-4">
        <h2 className="text-2xl font-semibold mb-6">Issuer Directory</h2>
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Issuer</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ticker</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Headquarters</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Regulation</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Backing</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuers.map((issuer, index) => (
                    <tr key={`${issuer.issuer}-${issuer.ticker}-${index}`} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{issuer.issuer}</td>
                      <td className="p-4 text-muted-foreground">{issuer.ticker}</td>
                      <td className="p-4 text-muted-foreground">{issuer.headquarters || '—'}</td>
                      <td className="p-4 text-muted-foreground">{issuer.regulation || '—'}</td>
                      <td className="p-4 text-muted-foreground">{issuer.backing || '—'}</td>
                      <td className="p-4">
                        <StatusBadge status={issuer.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden divide-y divide-border">
              {issuers.map((issuer, index) => (
                <div key={`${issuer.issuer}-${issuer.ticker}-${index}`} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{issuer.issuer}</p>
                    <StatusBadge status={issuer.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Ticker: </span>
                      <span>{issuer.ticker}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">HQ: </span>
                      <span>{issuer.headquarters || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Regulation: </span>
                      <span>{issuer.regulation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Backing: </span>
                      <span>{issuer.backing || '—'}</span>
                    </div>
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
