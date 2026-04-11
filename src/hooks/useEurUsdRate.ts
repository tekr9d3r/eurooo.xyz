import { useQuery } from '@tanstack/react-query';

interface FrankfurterResponse {
  rates: { EUR: number };
}

async function fetchRate(date: string): Promise<number> {
  const res = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=EUR`);
  if (!res.ok) throw new Error('Rate fetch failed');
  const json: FrankfurterResponse = await res.json();
  return json.rates.EUR;
}

function oneYearAgoDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

export function useEurUsdRate() {
  return useQuery({
    queryKey: ['eur-usd-rate'],
    queryFn: async () => {
      const [current, oneYearAgo] = await Promise.all([
        fetchRate('latest'),
        fetchRate(oneYearAgoDate()),
      ]);
      // Positive = USD weakened vs EUR (user lost purchasing power in EUR terms)
      const usdLossPct = ((oneYearAgo - current) / oneYearAgo) * 100;
      return { current, oneYearAgo, usdLossPct };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
}
