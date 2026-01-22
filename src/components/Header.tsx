import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';

export function Header() {
  const location = useLocation();
  const { isConnected } = useAccount();
  const isAppPage = location.pathname === '/app';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={isConnected ? '/app' : '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">€</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">EURC Yield Hub</span>
        </Link>

        <div className="flex items-center gap-4">
          {/* Navigation */}
          {isConnected && !isAppPage && (
            <Link 
              to="/app" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Open App
            </Link>
          )}
          
          {/* RainbowKit Connect Button */}
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </header>
  );
}
