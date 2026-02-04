import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { StatsPreview } from '@/components/StatsPreview';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'eurooo.xyz',
  url: 'https://eurooo.xyz',
  description: 'Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://eurooo.xyz/stats',
  },
};

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="eurooo.xyz - Grow Your Euros in DeFi"
        description="Compare and deposit EURC stablecoins across trusted DeFi protocols. Simple, transparent yield for Europeans."
        path="/"
        jsonLd={websiteSchema}
      />
      <Header />
      <main>
        <Hero />
        <StatsPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
