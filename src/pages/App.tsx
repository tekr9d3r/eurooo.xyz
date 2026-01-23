import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
};

export default AppPage;
