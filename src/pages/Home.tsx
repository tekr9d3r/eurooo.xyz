import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Home = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  // Redirect to app when wallet is connected
  useEffect(() => {
    if (isConnected) {
      navigate('/app');
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img 
                src="https://ifeyhwfcvgxkiwatorje.supabase.co/storage/v1/object/public/images/logo%20random.png" 
                alt="eurooo.xyz" 
                className="h-7 w-7 rounded-md object-cover" 
              />
              <span className="text-sm font-medium">eurooo.xyz</span>
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

export default Home;
