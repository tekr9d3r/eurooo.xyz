import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsHero } from '@/components/stats/StatsHero';
import { TopStablecoins } from '@/components/stats/TopStablecoins';
import { MarketShareChart } from '@/components/stats/MarketShareChart';
import { ChainDistributionChart } from '@/components/stats/ChainDistributionChart';
import { useStablecoinStats } from '@/hooks/useStablecoinStats';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const StatsPage = () => {
  const { data, isLoading, error, refetch } = useStablecoinStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {error ? (
          <section className="py-12">
            <div className="container px-4 text-center">
              <p className="text-muted-foreground mb-4">
                Data temporarily unavailable. Please try again.
              </p>
              <Button onClick={refetch} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </section>
        ) : (
          <>
            <StatsHero
              totalSupply={data?.totalSupply ?? null}
              lastUpdated={data?.lastUpdated ?? null}
              isLoading={isLoading}
            />
            <TopStablecoins
              stablecoins={data?.stablecoins ?? []}
              isLoading={isLoading}
            />
            <section className="py-8">
              <div className="container px-4">
                <h2 className="text-2xl font-semibold mb-6">Supply Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MarketShareChart
                    stablecoins={data?.stablecoins ?? []}
                    isLoading={isLoading}
                  />
                  <ChainDistributionChart
                    chains={data?.byChain ?? []}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StatsPage;
