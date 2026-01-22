import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Dashboard } from '@/components/Dashboard';
import { useAccount } from 'wagmi';

const Index = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!isConnected && <Hero />}
        <Dashboard />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <span className="text-sm font-bold text-primary-foreground">€</span>
              </div>
              <span className="text-sm font-medium">EURC Yield Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for Europeans. Your keys, your coins.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
