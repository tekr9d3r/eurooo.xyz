import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { BreakdownItem } from '@/hooks/useStablecoinStats';

interface BreakdownCardProps {
  title: string;
  items: BreakdownItem[];
  isLoading: boolean;
}

function formatValue(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(0)}M`;
  }
  return `€${(value / 1_000).toFixed(0)}K`;
}

function BreakdownCard({ title, items, isLoading }: BreakdownCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Take top 6 items, group rest as "Other"
  const displayItems = items.slice(0, 6);
  const otherItems = items.slice(6);
  
  if (otherItems.length > 0) {
    const otherTotal = otherItems.reduce((sum, item) => sum + item.value, 0);
    const otherPercentage = otherItems.reduce((sum, item) => sum + item.percentage, 0);
    displayItems.push({
      name: 'Other',
      value: otherTotal,
      percentage: otherPercentage,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayItems.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground truncate pr-2">{item.name}</span>
              <span className="text-muted-foreground whitespace-nowrap">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SupplyBreakdownProps {
  byBackingType: BreakdownItem[];
  byRegulatoryStatus: BreakdownItem[];
  byBlockchain: BreakdownItem[];
  isLoading: boolean;
}

export function SupplyBreakdown({
  byBackingType,
  byRegulatoryStatus,
  byBlockchain,
  isLoading,
}: SupplyBreakdownProps) {
  return (
    <section className="py-8">
      <div className="container px-4">
        <h2 className="text-2xl font-semibold mb-6">Supply Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BreakdownCard
            title="By Backing Type"
            items={byBackingType}
            isLoading={isLoading}
          />
          <BreakdownCard
            title="By Regulatory Status"
            items={byRegulatoryStatus}
            isLoading={isLoading}
          />
          <BreakdownCard
            title="By Blockchain"
            items={byBlockchain}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
