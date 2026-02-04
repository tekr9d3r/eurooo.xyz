import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { EURStablecoin } from '@/hooks/useStablecoinStats';
import { useIsMobile } from '@/hooks/use-mobile';

interface MarketShareChartProps {
  stablecoins: EURStablecoin[];
  isLoading: boolean;
}

// Brighter colors that work well in both light and dark modes
const COLORS = [
  'hsl(220, 100%, 55%)', // EU Blue (brighter)
  'hsl(160, 84%, 50%)',  // Success Green
  'hsl(258, 90%, 66%)',  // Purple
  'hsl(25, 95%, 58%)',   // Orange
  'hsl(330, 81%, 65%)',  // Pink
  'hsl(187, 92%, 50%)',  // Cyan
  'hsl(48, 96%, 55%)',   // Yellow
  'hsl(220, 20%, 60%)',  // Gray (lighter)
];

function formatEuro(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  return `€${value.toLocaleString()}`;
}

export function MarketShareChart({ stablecoins, isLoading }: MarketShareChartProps) {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Share Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  // Top 7, group rest as "Other"
  const top7 = stablecoins.slice(0, 7);
  const others = stablecoins.slice(7);
  
  const chartData = top7.map((s) => ({
    name: s.symbol,
    value: s.circulating,
  }));

  if (others.length > 0) {
    const otherTotal = others.reduce((sum, s) => sum + s.circulating, 0);
    chartData.push({ name: 'Other', value: otherTotal });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Market Share Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy={isMobile ? "45%" : "50%"}
              outerRadius={isMobile ? 70 : 100}
              label={isMobile ? false : ({ name, percent }) =>
                percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
              style={{ fontSize: isMobile ? 10 : 12 }}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatEuro(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
              labelStyle={{
                color: 'hsl(var(--card-foreground))',
              }}
              itemStyle={{
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              iconSize={isMobile ? 8 : 14}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
