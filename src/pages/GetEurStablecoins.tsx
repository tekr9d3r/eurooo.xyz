import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EURC_BASE_ADDRESS = '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42';
const BASE_CHAIN_ID = 8453;

const JUMPER_URL = `https://jumper.exchange/?toChain=${BASE_CHAIN_ID}&toToken=${EURC_BASE_ADDRESS}`;

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
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Get EUR Stablecoins
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8">
            Swap any token to EURC on Base — cross-chain, in one step. Powered by LI.FI.
          </p>

          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="text-6xl mb-4">💱</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Swap to EURC
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Use Jumper Exchange to swap any token from any chain to EURC on Base with the best rates.
            </p>
            <Button asChild size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
              <a href={JUMPER_URL} target="_blank" rel="noopener noreferrer">
                Open Jumper Exchange
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              EURC on Base will be pre-selected as destination.
            </p>
          </div>

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
