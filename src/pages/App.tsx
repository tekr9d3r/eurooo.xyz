import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { WagmiReadyGuard } from '@/components/WagmiReadyGuard';
import { SEO } from '@/components/SEO';

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="DeFi Yields Dashboard"
        description="Compare live APY rates and deposit EUR stablecoins across Aave, Morpho, Summer.fi, and more."
        path="/app"
      />
      <Header />
      <main>
        <WagmiReadyGuard
          fallback={
            <section className="py-12">
              <div className="container flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </section>
          }
        >
          <Dashboard />
        </WagmiReadyGuard>
      </main>
      <Footer />
    </div>
  );
};

export default AppPage;
