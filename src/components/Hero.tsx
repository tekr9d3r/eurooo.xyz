import { useAccount, useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, TrendingUp, Zap } from 'lucide-react';

export function Hero() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    const injected = connectors.find((c) => c.id === 'injected');
    if (injected) {
      connect({ connector: injected });
    }
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Subtle EU-inspired background pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Live APY up to</span>
            <span className="font-semibold text-success">8.5%</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Grow Your Euros{' '}
            <span className="text-primary">in DeFi</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Compare and deposit your EURC stablecoins across trusted protocols with eurooo.xyz. 
            Simple, transparent, and built for Europeans.
          </p>

          {/* CTA */}
          {!isConnected && (
            <Button
              size="lg"
              onClick={handleConnect}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              Start Earning
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {/* Trust indicators */}
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Trusted Protocols</h3>
              <p className="text-sm text-muted-foreground">
                Aave, Summer.fi, and Yo — battle-tested DeFi platforms
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold">Real-time Yields</h3>
              <p className="text-sm text-muted-foreground">
                Watch your euros grow with live APY tracking
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Zap className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Multi-chain</h3>
              <p className="text-sm text-muted-foreground">
                Deposit on Ethereum or Base — your choice
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
