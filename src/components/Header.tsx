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
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={euroooLogo} alt="eurooo.xyz" className="h-14 w-14 rounded-lg object-cover" />
          <span className="text-xl font-semibold tracking-tight">eurooo.xyz</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          {isConnected && !isAppPage && (
            <Link 
              to="/app" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              Open App
            </Link>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* RainbowKit Connect Button */}
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
}
