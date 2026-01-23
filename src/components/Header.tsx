import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ThemeToggle } from './ThemeToggle';
const euroooLogo = "https://ifeyhwfcvgxkiwatorje.supabase.co/storage/v1/object/public/images/logo%20random.png";

export function Header() {
  const location = useLocation();
  const { isConnected } = useAccount();
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
          {/* Navigation */}
          {isConnected && !isAppPage && (
            <Link 
              to="/app" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1 sm:mr-2"
            >
              Open App
            </Link>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* RainbowKit Connect Button - Compact on mobile */}
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
        </div>
      </div>
    </header>
  );
}
