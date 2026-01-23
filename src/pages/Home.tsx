import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';
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
      <Footer />
    </div>
  );
};

export default Home;
