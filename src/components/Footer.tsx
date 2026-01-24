import farcasterLogo from '@/assets/farcaster-logo.png';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-16">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Left: Logo and tagline */}
          <div className="flex items-center gap-3">
            <img
              src="https://ifeyhwfcvgxkiwatorje.supabase.co/storage/v1/object/public/images/logo%20random.png"
              alt="eurooo.xyz"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div>
              <span className="text-sm font-medium">eurooo.xyz</span>
              <p className="text-xs text-muted-foreground">
                Grow Your Euros in DeFi.
              </p>
            </div>
          </div>

          {/* Right: Social links */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/tekr0x"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-foreground hover:text-background hover:scale-110"
              aria-label="Follow on X"
            >
              <XIcon className="h-4 w-4" />
            </a>
            <a
              href="https://farcaster.xyz/tekrox.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:scale-110 overflow-hidden"
              aria-label="Follow on Farcaster"
            >
              <img src={farcasterLogo} alt="Farcaster" className="h-full w-full object-cover" />
            </a>
            <a
              href="https://t.me/+wxIKk-lsEy5kMGQ0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all duration-300 hover:bg-[#0088cc] hover:text-white hover:scale-110"
              aria-label="Join our Telegram"
            >
              <TelegramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
