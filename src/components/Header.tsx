import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">€</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">EURC Yield Hub</span>
        </div>

        {/* RainbowKit Connect Button */}
        <ConnectButton />
      </div>
    </header>
  );
}
