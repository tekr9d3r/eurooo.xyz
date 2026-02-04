import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsHero } from '@/components/stats/StatsHero';
import { TopStablecoins } from '@/components/stats/TopStablecoins';
import { MarketShareChart } from '@/components/stats/MarketShareChart';
import { ChainDistributionChart } from '@/components/stats/ChainDistributionChart';
import { QuotableStats } from '@/components/stats/QuotableStats';
import { StatsFAQ, generateFAQSchema } from '@/components/stats/StatsFAQ';
import { SEO } from '@/components/SEO';
import { useStablecoinStats } from '@/hooks/useStablecoinStats';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const datasetSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'EUR Stablecoin Market Data',
  description: 'Real-time circulating supply and market share data for Euro-denominated stablecoins including EURC, EURS, and more.',
  url: 'https://eurooo.xyz/stats',
  temporalCoverage: '2024/..',
  creator: {
    '@type': 'Organization',
    name: 'eurooo.xyz',
    url: 'https://eurooo.xyz',
  },
  distribution: {
    '@type': 'DataDownload',
    contentUrl: 'https://eurooo.xyz/stats',
    encodingFormat: 'text/html',
  },
  keywords: ['EUR stablecoin', 'Euro stablecoin', 'EURC', 'EURS', 'stablecoin market cap', 'DeFi'],
};

const StatsPage = () => {
  const { data, isLoading, error, refetch } = useStablecoinStats();

  // Generate dynamic FAQ schema with real data
  const faqSchema = data 
    ? generateFAQSchema(data.totalSupply, data.stablecoins, data.byChain)
    : null;

  const jsonLdSchemas = faqSchema ? [datasetSchema, faqSchema] : [datasetSchema];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="EUR Stablecoin Market Stats"
        description="Real-time data on Euro stablecoin supply, market share, and blockchain distribution. Track EURC, EURS, and more."
        path="/stats"
        jsonLd={jsonLdSchemas}
      />
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
              change30d={data?.change30d ?? null}
              lastUpdated={data?.lastUpdated ?? null}
              isLoading={isLoading}
            />
            <QuotableStats
              totalSupply={data?.totalSupply ?? null}
              stablecoins={data?.stablecoins ?? []}
              chains={data?.byChain ?? []}
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
            <StatsFAQ
              totalSupply={data?.totalSupply ?? null}
              stablecoins={data?.stablecoins ?? []}
              chains={data?.byChain ?? []}
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
