import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LiFiWidget, type WidgetConfig } from '@lifi/widget';

const EURC_BASE_ADDRESS = '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42';
const BASE_CHAIN_ID = 8453;

const widgetConfig: WidgetConfig = {
  integrator: 'eurooo',
  toChain: BASE_CHAIN_ID,
  toToken: EURC_BASE_ADDRESS,
  appearance: 'system',
  theme: {
    container: {
      border: '1px solid hsl(220, 15%, 90%)',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    },
    palette: {
      primary: { main: 'hsl(220, 100%, 30%)' },
      secondary: { main: 'hsl(48, 100%, 50%)' },
    },
    shape: {
      borderRadius: 12,
      borderRadiusSecondary: 8,
    },
  },
};

const GetEurStablecoins = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Get EUR Stablecoins"
        description="Swap any token to EUR stablecoins like EURC using the best cross-chain routes. Bridge and swap in one step."
        path="/get-eur-stablecoins"
      />
      <Header />
      <main className="container py-8 md:py-16">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Get EUR Stablecoins
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8">
            Swap any token to EURC on Base — cross-chain, in one step. Powered by LI.FI.
          </p>

          <LiFiWidget integrator="eurooo" config={widgetConfig} />

          <div className="mt-8 p-4 rounded-lg bg-secondary">
            <p className="text-sm text-muted-foreground mb-2">
              Already have EUR stablecoins?
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Earn yield on them
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GetEurStablecoins;
