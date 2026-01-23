import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, TrendingUp, Zap } from 'lucide-react';
import aaveLogo from '@/assets/aave-logo.png';
import summerLogo from '@/assets/summer-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';
import yoLogo from '@/assets/yo-logo.png';

// Animated EU-style gold stars component with parallax
function AnimatedStars() {
  const stars = Array.from({
    length: 12
  }, (_, i) => i);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax offset - stars move slower than scroll
  const parallaxOffset = scrollY * 0.15;
  return <div className="absolute inset-0 pointer-events-none">
      {/* Rotating container for the stars */}
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] sm:w-[600px] sm:h-[600px]" style={{
      transform: `translate(-50%, calc(-50% + ${parallaxOffset}px))`,
      animation: 'spin-circle 30s linear infinite'
    }}>
        {stars.map(i => {
        const angle = i * 30 * (Math.PI / 180);
        const radius = 42; // percentage from center
        const x = 50 + radius * Math.cos(angle - Math.PI / 2);
        const y = 50 + radius * Math.sin(angle - Math.PI / 2);
        return <div key={i} className="absolute w-3 h-3 sm:w-4 sm:h-4" style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          animation: `counter-spin 30s linear infinite, twinkle ${2 + i % 3}s ease-in-out infinite`,
          animationDelay: `0s, ${i * 0.3}s`
        }}>
              <svg viewBox="0 0 24 24" fill="hsl(var(--accent))" className="w-full h-full drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            </div>;
      })}
      </div>
      
      <style>{`
        @keyframes spin-circle {
          from {
            transform: translate(-50%, calc(-50%)) rotate(0deg);
          }
          to {
            transform: translate(-50%, calc(-50%)) rotate(360deg);
          }
        }
        @keyframes counter-spin {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-360deg);
          }
        }
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.6;
            filter: drop-shadow(0 0 4px hsl(var(--accent) / 0.3));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 12px hsl(var(--accent) / 0.8));
          }
        }
      `}</style>
    </div>;
}
export function Hero() {
  const navigate = useNavigate();
  const handleStartEarning = () => {
    navigate('/app');
  };
  const protocols = [{
    name: 'Aave',
    logo: aaveLogo
  }, {
    name: 'Summer.fi',
    logo: summerLogo
  }, {
    name: 'Morpho',
    logo: morphoLogo
  }, {
    name: 'YO Protocol',
    logo: yoLogo
  }];
  return <section className="relative overflow-hidden py-24 lg:py-40">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-float animation-delay-300" />
      </div>

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm opacity-0 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-muted-foreground">Live APY up to</span>
            <span className="font-semibold text-success">6.5%</span>
          </div>

          {/* Headline with animated stars */}
          <div className="relative mb-6">
            <AnimatedStars />
            <h1 className="relative z-10 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl opacity-0 animate-fade-in-up animation-delay-100">
              Grow Your Euros{' '}
              <span className="text-primary">in DeFi</span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-muted-foreground sm:text-xl lg:text-2xl opacity-0 animate-fade-in-up animation-delay-200">
            Compare and deposit your EUR stablecoins across trusted protocols. Simple, transparent, and built to help bring DeFi to EUR.
          </p>

          {/* CTA */}
          <div className="opacity-0 animate-fade-in animation-delay-300">
            <Button size="lg" onClick={handleStartEarning} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5">
              Start Earning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Protocol logos section */}
          <div className="mt-20 opacity-0 animate-fade-in animation-delay-400">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
              Supported protocols
            </p>
            <div className="flex items-center justify-center gap-8 sm:gap-12">
              {protocols.map(protocol => <div key={protocol.name} className="group relative">
                  <img src={protocol.logo} alt={protocol.name} className="h-8 w-8 sm:h-10 sm:w-10 object-contain protocol-logo" />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {protocol.name}
                  </span>
                </div>)}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-24 grid gap-6 sm:grid-cols-3 opacity-0 animate-fade-in-up animation-delay-500">
            <div className="group flex flex-col items-center gap-3 text-center p-6 rounded-2xl transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold">Trusted Protocols</h3>
              <p className="text-sm text-muted-foreground">
                Aave, Summer.fi, Morpho & YO — battle-tested DeFi platforms
              </p>
            </div>
            <div className="group flex flex-col items-center gap-3 text-center p-6 rounded-2xl transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="h-7 w-7 text-success" />
              </div>
              <h3 className="font-semibold">Real-time Yields</h3>
              <p className="text-sm text-muted-foreground">
                Watch your euros grow with live APY tracking
              </p>
            </div>
            <div className="group flex flex-col items-center gap-3 text-center p-6 rounded-2xl transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 transition-transform duration-300 group-hover:scale-110">
                <Zap className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Multi-chain</h3>
              <p className="text-sm text-muted-foreground">
                Deposit on Ethereum or Base — your choice
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}