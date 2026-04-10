import React, { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { ArrowRight, ArrowLeftRight, BarChart2, BookOpen, Menu, Wallet, X } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const navLinks = isAppPage
    ? [
        { label: 'Knowledge Hub', icon: BookOpen, href: 'https://hub.eurooo.xyz/' },
        { label: 'Stats', icon: BarChart2, to: '/stats' },
        { label: 'Swap', icon: ArrowLeftRight, href: 'https://www.swap.eurooo.xyz/' },
      ]
    : [
        { label: 'Knowledge Hub', icon: BookOpen, href: 'https://hub.eurooo.xyz/' },
        { label: 'Stats', icon: BarChart2, to: '/stats' },
        { label: 'Swap', icon: ArrowLeftRight, href: 'https://www.swap.eurooo.xyz/' },
        { label: 'Earn', icon: Wallet, to: '/app' },
      ];

  const renderNavLink = (
    link: { label: string; icon: React.ElementType; href?: string; to?: string },
    className: string,
    onClick?: () => void
  ) => {
    const Icon = link.icon;
    const content = (
      <>
        <Icon className="h-4 w-4 shrink-0" />
        {link.label}
      </>
    );
    if (link.to) {
      return (
        <Link key={link.label} to={link.to} className={className} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return (
      <a key={link.label} href={link.href} className={className} onClick={onClick}>
        {content}
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

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* ConnectButton — app page only */}
          {isAppPage && (
            <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />}>
              <ConnectButton
                showBalance={false}
                accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
                chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
              />
            </Suspense>
          )}

          <ThemeToggle />

          {/* Desktop CTA buttons — always visible on wide screens */}
          {!isAppPage && (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1">
                <a href="https://www.swap.eurooo.xyz/">
                  Swap <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button asChild size="sm" className="gap-1 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Link to="/app">
                  Earn <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}

          {/* Hamburger — all screen sizes */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`block transition-all duration-200 ${open ? 'rotate-90 opacity-0 absolute' : 'rotate-0 opacity-100'}`}
              >
                <Menu className="h-5 w-5" />
              </span>
              <span
                className={`block transition-all duration-200 ${open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}
              >
                <X className="h-5 w-5" />
              </span>
            </button>

            {/* Desktop floating dropdown */}
            <div
              className={`hidden md:block absolute top-full right-0 mt-2 w-52 rounded-xl border border-border/60 bg-background shadow-xl shadow-black/10 overflow-hidden transition-all duration-200 ease-out origin-top-right ${
                open
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
              }`}
            >
              <nav className="flex flex-col gap-0.5 p-2">
                {navLinks.map((link) =>
                  renderNavLink(
                    link,
                    'flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-secondary/50',
                    () => setOpen(false)
                  )
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile full-width dropdown */}
      <div
        className={`md:hidden border-border/40 bg-background/95 backdrop-blur overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100 border-t' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) =>
            renderNavLink(
              link,
              'flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-secondary/50',
              () => setOpen(false)
            )
          )}
        </nav>
      </div>
    </header>
  );
}
