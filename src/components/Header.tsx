import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';

const euroooLogo = "https://ifeyhwfcvgxkiwatorje.supabase.co/storage/v1/object/public/images/logo%20random.png";

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
              <Link 
                to="/stats" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
              >
                Stats
              </Link>
              <Link 
                to="/blog" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
              >
                Knowledge Hub
              </Link>
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
              <Link 
                to="/blog" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <span>📚</span>
                <span className="hidden sm:inline">Knowledge Hub</span>
                <span className="sm:hidden">Learn</span>
              </Link>
              <Link 
                to="/stats" 
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              >
                <span>📊</span>
                Stats
              </Link>
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
