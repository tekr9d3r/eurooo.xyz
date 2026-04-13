import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/components/WalletProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useLiFiVaults, LiFiVault } from '@/hooks/useLiFiVaults';
import aaveLogo from '@/assets/aave-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';
import yoLogo from '@/assets/yo-logo.png';
import fluidLogo from '@/assets/fluid-logo.png';
import moonwellLogo from '@/assets/moonwell-logo.png';

// ── Protocol logos ────────────────────────────────────────────────────────────

const PROTOCOL_LOGOS: Record<string, string> = {
  'aave-v3':    aaveLogo,
  'morpho-v1':  morphoLogo,
  'yo-protocol': yoLogo,
  'fluid':      fluidLogo,
  'moonwell':   moonwellLogo,
};

// ── Chain display names ───────────────────────────────────────────────────────

const CHAIN_LABELS: Record<number, string> = {
  1:     'Ethereum',
  8453:  'Base',
  42161: 'Arbitrum',
  10:    'Optimism',
  137:   'Polygon',
  100:   'Gnosis',
  43114: 'Avalanche',
};

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined) {
  if (val == null) return '—';
  return `${val.toFixed(2)}%`;
}

function fmtTvl(usd: number) {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000)         return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

// ── Vault row ─────────────────────────────────────────────────────────────────

function VaultRow({ vault }: { vault: LiFiVault }) {
  const logo = PROTOCOL_LOGOS[vault.protocol.name];
  const chainLabel = CHAIN_LABELS[vault.chainId] ?? vault.network;
  const token = vault.underlyingTokens[0];
  const apy = vault.analytics.apy.total ?? 0;
  const apy7d = vault.analytics.apy7d;
  const apy30d = vault.analytics.apy30d;
  const tvl = Number(vault.analytics.tvl.usd);

  return (
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
      {/* Protocol */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {logo ? (
            <img src={logo} alt={vault.protocol.name} className="w-6 h-6 rounded-full object-contain" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {vault.protocol.name[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium text-sm">{vault.name}</span>
        </div>
      </td>

      {/* Network */}
      <td className="px-4 py-3">
        <Badge variant="outline" className="text-xs font-normal">{chainLabel}</Badge>
      </td>

      {/* Token */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {token?.symbol ?? '—'}
      </td>

      {/* APY */}
      <td className="px-4 py-3 text-sm font-semibold text-emerald-500">
        {fmt(apy)}
      </td>

      {/* 7d APY */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {fmt(apy7d)}
      </td>

      {/* 30d APY */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {fmt(apy30d)}
      </td>

      {/* TVL */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {fmtTvl(tvl)}
      </td>

      {/* Link */}
      <td className="px-4 py-3">
        <a
          href={vault.protocol.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
      </td>
    </tr>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border/40">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function EarnContent() {
  const { data: vaults = [], isLoading, error } = useLiFiVaults();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">EUR Yield Vaults</h1>
        <p className="text-muted-foreground">
          EUR stablecoin vaults from the{' '}
          <a
            href="https://earn.li.fi"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            LI.FI Earn API
          </a>
          . Data refreshes every 5 minutes.
        </p>
      </div>

      {/* Stats bar */}
      {!isLoading && !error && vaults.length > 0 && (
        <div className="flex gap-6 mb-6 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{vaults.length}</strong> vaults</span>
          <span>
            Best APY:{' '}
            <strong className="text-emerald-500">{fmt(vaults[0]?.analytics.apy.total)}</strong>
          </span>
          <span>
            Avg APY:{' '}
            <strong className="text-foreground">
              {fmt(vaults.reduce((s, v) => s + (v.analytics.apy.total ?? 0), 0) / vaults.length)}
            </strong>
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 mb-6">
          Failed to load vaults: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Protocol</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Network</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Token</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">APY</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">7d APY</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">30d APY</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">TVL</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Link</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : vaults.length === 0 && !error ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No EUR vaults found.
                </td>
              </tr>
            ) : (
              vaults.map((v) => <VaultRow key={v.slug} vault={v} />)
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default function LiFiEarnPage() {
  return (
    <WalletProvider>
      <SEO
        title="EUR Yield Vaults | Eurooo"
        description="Find the best EUR stablecoin yield across DeFi protocols."
        path="/earn"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <EarnContent />
        </main>
        <Footer />
      </div>
    </WalletProvider>
  );
}
