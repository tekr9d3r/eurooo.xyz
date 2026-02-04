import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsHero } from '@/components/stats/StatsHero';
import { TopStablecoins } from '@/components/stats/TopStablecoins';
import { SupplyBreakdown } from '@/components/stats/SupplyBreakdown';
import { IssuerDirectory } from '@/components/stats/IssuerDirectory';
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
              tokens={data?.topStablecoins ?? []}
              isLoading={isLoading}
            />
            <SupplyBreakdown
              byBackingType={data?.byBackingType ?? []}
              byRegulatoryStatus={data?.byRegulatoryStatus ?? []}
              byBlockchain={data?.byBlockchain ?? []}
              isLoading={isLoading}
            />
            <IssuerDirectory
              issuers={data?.issuers ?? []}
              isLoading={isLoading}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StatsPage;
