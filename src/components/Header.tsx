import { lazy, Suspense, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import euroooLogo from '@/assets/eurooo-logo.png';

// Lazy-load RainbowKit ConnectButton so it's only downloaded on /app
const ConnectButton = lazy(() =>
  import('@rainbow-me/rainbowkit').then((mod) => ({
    default: mod.ConnectButton,
  }))
);

export function Header() {
  const location = useLocation();
  const isAppPage = location.pathname === '/app';
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = isAppPage
    ? [
        { label: '📚 Knowledge Hub', href: 'https://hub.eurooo.xyz/', external: true },
        { label: '📊 Stats', to: '/stats' },
        { label: '🔄 Swap', href: 'https://www.swap.eurooo.xyz/', external: true },
      ]
    : [
        { label: '📚 Knowledge Hub', href: 'https://hub.eurooo.xyz/', external: true },
        { label: '📊 Stats', to: '/stats' },
      ];

  const renderNavLink = (link: { label: string; href?: string; to?: string; external?: boolean }, className: string, onClick?: () => void) => {
    if (link.to) {
      return (
        <Link key={link.label} to={link.to} className={className} onClick={onClick}>
          {link.label}
        </Link>
      );
    }
    return (
      <a key={link.label} href={link.href} className={className} onClick={onClick}>
        {link.label}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={euroooLogo} alt="eurooo.xyz" className="h-10 w-10 md:h-14 md:w-14 rounded-lg object-cover" />
          <span className="text-xl font-semibold tracking-tight">eurooo.xyz</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          {isAppPage ? (
            <>
              {navLinks.map((link) =>
                renderNavLink(link, 'flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2')
              )}
              <ThemeToggle />
              <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />}>
                <ConnectButton
                  showBalance={false}
                  accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
                  chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
                />
              </Suspense>
            </>
          ) : (
            <>
              <ThemeToggle />
              {navLinks.map((link) =>
                renderNavLink(link, 'flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1')
              )}
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

        {/* Mobile: key actions + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          {isAppPage && (
            <Suspense fallback={<div className="h-8 w-20 animate-pulse rounded-xl bg-muted" />}>
              <ConnectButton
                showBalance={false}
                accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
                chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
              />
            </Suspense>
          )}
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur animate-in slide-in-from-top-2 duration-200">
          <nav className="container flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) =>
              renderNavLink(
                link,
                'flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-secondary/50',
                () => setMobileOpen(false)
              )
            )}
            {!isAppPage && (
              <>
                <a
                  href="https://www.swap.eurooo.xyz/"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-secondary/50"
                  onClick={() => setMobileOpen(false)}
                >
                  🔄 Swap
                </a>
                <Link
                  to="/app"
                  className="flex items-center justify-center gap-1 mt-1 text-sm font-semibold bg-primary text-primary-foreground rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                  onClick={() => setMobileOpen(false)}
                >
                  Earn <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
