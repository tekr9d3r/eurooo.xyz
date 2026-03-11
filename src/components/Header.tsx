import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import euroooLogo from '@/assets/eurooo-logo.png';

export function Header() {
  const location = useLocation();
  const isAppPage = location.pathname === '/app';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={euroooLogo} alt="eurooo.xyz" className="h-10 w-10 md:h-14 md:w-14 rounded-lg object-cover" />
          <span className="hidden sm:inline text-xl font-semibold tracking-tight">eurooo.xyz</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {isAppPage ? (
            <>
              {/* App page: show wallet connection */}
              <a
                href="https://luma.com/mznyc1io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium border border-accent/40 bg-accent/10 text-foreground rounded-full px-2 py-0.5 hover:bg-accent/20 transition-colors mr-1 sm:mr-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="hidden sm:inline">B€€R. Euros. DeFi.</span>
                <span className="sm:hidden">B€€R</span>
              </a>
              <a 
                href="https://hub.eurooo.xyz/" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
              >
                <span>📚</span>
                <span className="hidden sm:inline">Knowledge Hub</span>
              </a>
              <Link 
                to="/stats" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
              >
                <span>📊</span>
                Stats
              </Link>
              <a
                href="https://www.swap.eurooo.xyz/"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
              >
                <span>🔄</span>
                Swap
              </a>
              <ThemeToggle />
              <ConnectButton 
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
                chainStatus={{
                  smallScreen: 'icon',
                  largeScreen: 'full',
                }}
              />
            </>
          ) : (
            <>
              {/* Home/other pages: show navigation buttons */}
              <ThemeToggle />
              <a
                href="https://luma.com/mznyc1io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium border border-accent/40 bg-accent/10 text-foreground rounded-full px-2 py-0.5 hover:bg-accent/20 transition-colors"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="hidden sm:inline">B€€R. Euros. DeFi.</span>
                <span className="sm:hidden">B€€R</span>
              </a>
              <a 
                href="https://hub.eurooo.xyz/" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <span>📚</span>
                <span className="hidden sm:inline">Knowledge Hub</span>
                <span className="sm:hidden">Learn</span>
              </a>
              <Link 
                to="/stats" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <span>📊</span>
                Stats
              </Link>
              <Button asChild size="sm" variant="outline" className="gap-1">
                <a href="https://www.swap.eurooo.xyz/">
                  Swap
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild size="sm" className="gap-1 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Link to="/app">
                  Earn
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
