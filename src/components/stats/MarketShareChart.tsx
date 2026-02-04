import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { EURStablecoin } from '@/hooks/useStablecoinStats';

interface MarketShareChartProps {
  stablecoins: EURStablecoin[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(220, 100%, 30%)', // EU Blue
  'hsl(160, 84%, 39%)',  // Success Green
  'hsl(258, 90%, 66%)',  // Purple
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(330, 81%, 60%)',  // Pink
  'hsl(187, 92%, 43%)',  // Cyan
  'hsl(48, 96%, 53%)',   // Yellow
  'hsl(220, 9%, 46%)',   // Gray
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
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                percent > 0.03 ? `${name} ${(percent * 100).toFixed(1)}%` : ''
              }
              labelLine={false}
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
