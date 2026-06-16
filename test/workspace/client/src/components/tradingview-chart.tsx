import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTheme } from './theme-provider';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
}

export function TradingViewChart({ 
  symbol, 
  interval = 'D',
  theme: propTheme,
  height = 400 
}: TradingViewChartProps) {
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme || 'dark';

  // Map interval to period
  const getPeriod = (interval: string) => {
    if (interval === '5') return '1H';
    if (interval === '15') return '1D';
    if (interval === '60') return '1W';
    if (interval === '240') return '1M';
    if (interval === 'D') return '1Y';
    return '1D';
  };

  const period = getPeriod(interval);

  // Fetch chart data from our backend API
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['/api/chart', symbol.toLowerCase(), period],
    queryFn: async () => {
      const res = await fetch(`/api/chart/${symbol.toLowerCase()}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      return res.json();
    },
    enabled: !!symbol,
  });

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center bg-card/50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chartData || !(chartData as any)?.prices || (chartData as any).prices.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-card/50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <p className="text-sm text-muted-foreground">No chart data available</p>
      </div>
    );
  }

  // Format data for recharts
  const prices = (chartData as any).prices;
  const formattedData = prices.map((point: [number, number]) => ({
    timestamp: point[0],
    price: point[1],
    time: new Date(point[0]).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(period === '1H' || period === '1D' ? { hour: '2-digit', minute: '2-digit' } : {})
    })
  }));

  const minPrice = Math.min(...formattedData.map((d: any) => d.price));
  const maxPrice = Math.max(...formattedData.map((d: any) => d.price));
  const priceRange = maxPrice - minPrice;
  const yMin = minPrice - (priceRange * 0.1);
  const yMax = maxPrice + (priceRange * 0.1);

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            domain={[yMin, yMax]}
            tickFormatter={(value) => {
              if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
              if (value >= 1) return `$${value.toFixed(2)}`;
              return `$${value.toFixed(4)}`;
            }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === 'dark' ? 'hsl(215, 100%, 6%)' : 'hsl(220, 100%, 99%)',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500, marginBottom: 4 }}
            formatter={(value: any) => [
              `$${typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : value}`,
              'Price'
            ]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorPrice)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
