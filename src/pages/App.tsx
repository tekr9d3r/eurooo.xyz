import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { WagmiReadyGuard } from '@/components/WagmiReadyGuard';
import { SEO } from '@/components/SEO';
import { WalletProvider } from '@/components/WalletProvider';

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="eurooo.xyz - Grow Your Euros in DeFi"
        description="Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans."
        path="/"
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
