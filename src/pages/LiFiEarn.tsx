import { useState, Suspense, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/components/WalletProvider';
import { WagmiReadyGuard } from '@/components/WagmiReadyGuard';
import { useEuroooVaults, UnifiedVault } from '@/hooks/useEuroooVaults';
import { useProtocolData } from '@/hooks/useProtocolData';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ExternalLink, TrendingUp, Zap, Wallet } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useReadContract, useSendTransaction } from 'wagmi';
import { mainnet, base, gnosis, avalanche } from 'wagmi/chains';
import { ERC20_ABI } from '@/lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CHAIN_MAP = { 1: mainnet, 8453: base, 100: gnosis, 43114: avalanche } as const;
const COMPOSER_API = '/lifi-composer';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY as string;

function formatApy(val: number | null | undefined) {
  if (val == null) return '—';
  return `${val.toFixed(2)}%`;
}

function formatTvl(usd: number) {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

function formatBalance(val: number) {
  return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Portfolio Summary ────────────────────────────────────────────────────────

function PortfolioSummary({ totalDeposits, averageApy, isLoading }: {
  totalDeposits: number;
  averageApy: number;
  isLoading: boolean;
}) {
  const [liveBalance, setLiveBalance] = useState(totalDeposits);

  useEffect(() => { setLiveBalance(totalDeposits); }, [totalDeposits]);

  useEffect(() => {
    if (totalDeposits <= 0 || averageApy <= 0) return;
    const yieldPerSec = (totalDeposits * (averageApy / 100)) / (365 * 24 * 60 * 60);
    const t = setInterval(() => setLiveBalance((v) => v + yieldPerSec), 1000);
    return () => clearInterval(t);
  }, [totalDeposits, averageApy]);

  const daily = (totalDeposits * (averageApy / 100)) / 365;
  const weekly = daily * 7;
  const yearly = totalDeposits * (averageApy / 100);
  const hasDeposits = totalDeposits > 0;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 md:p-6 mb-8">
      {isLoading ? (
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      ) : !hasDeposits ? (
        <div className="text-center py-3">
          <p className="text-muted-foreground text-sm">Connect your wallet to see your portfolio balance.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Top row: balance + APY */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Portfolio</p>
              <div className="text-3xl font-bold text-emerald-500 tracking-tight">
                €{formatBalance(liveBalance)}
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Avg APY</p>
                <Badge variant="secondary" className="text-base px-3 py-1">{formatApy(averageApy)}</Badge>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Daily</p>
                <p className="text-sm font-semibold text-emerald-500">+€{daily.toFixed(4)}</p>
              </div>
              <div className="hidden md:block h-8 w-px bg-border" />
              <div className="hidden md:block text-center">
                <p className="text-xs text-muted-foreground mb-1">Weekly</p>
                <p className="text-sm font-semibold text-emerald-500">+€{weekly.toFixed(3)}</p>
              </div>
              <div className="hidden md:block h-8 w-px bg-border" />
              <div className="hidden md:block text-center">
                <p className="text-xs text-muted-foreground mb-1">Yearly</p>
                <p className="text-sm font-semibold text-emerald-500">+€{formatBalance(yearly)}</p>
              </div>
            </div>
          </div>
          {/* Mobile yield row */}
          <div className="flex md:hidden items-center gap-4 text-xs text-muted-foreground border-t border-border/40 pt-3">
            <span>Weekly <span className="text-emerald-500 font-semibold">+€{weekly.toFixed(3)}</span></span>
            <span>·</span>
            <span>Yearly <span className="text-emerald-500 font-semibold">+€{formatBalance(yearly)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deposit button states ────────────────────────────────────────────────────

type DepositStatus = 'idle' | 'switching' | 'quoting' | 'approving' | 'depositing' | 'error';

const BUTTON_LABEL: Record<DepositStatus, string> = {
  idle: 'Deposit',
  switching: 'Switching chain…',
  quoting: 'Getting quote…',
  approving: 'Approving token…',
  depositing: 'Confirm in wallet…',
  error: 'Retry',
};

// ── Vault Card ───────────────────────────────────────────────────────────────

interface VaultCardProps {
  vault: UnifiedVault;
  userDeposit: number;
}

function VaultCard({ vault, userDeposit }: VaultCardProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const [status, setStatus] = useState<DepositStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [approvalAddress, setApprovalAddress] = useState<`0x${string}` | null>(null);

  const { refetch: refetchAllowance } = useReadContract({
    address: vault.lifiTokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && approvalAddress ? [address, approvalAddress] : undefined,
    query: { enabled: false },
  });

  async function handleDeposit() {
    if (!address || !vault.lifiAddress || !vault.lifiTokenAddress || !vault.chainId) return;
    setErrorMsg('');
    try {
      if (chainId !== vault.chainId) {
        setStatus('switching');
        await switchChainAsync({ chainId: vault.chainId as keyof typeof CHAIN_MAP });
      }

      setStatus('quoting');
      const decimals = vault.lifiTokenDecimals ?? 6;
      const fromAmount = String(10 ** decimals);

      const params = new URLSearchParams({
        fromChain: String(vault.chainId),
        toChain: String(vault.chainId),
        fromToken: vault.lifiTokenAddress,
        toToken: vault.lifiAddress,
        fromAddress: address,
        toAddress: address,
        fromAmount,
      });

      const res = await fetch(`${COMPOSER_API}/v1/quote?${params}`, {
        headers: { 'x-lifi-api-key': LIFI_API_KEY },
      });
      if (!res.ok) throw new Error(`Quote failed: ${res.status}`);
      const quote = await res.json();
      const tx = quote.transactionRequest;
      if (!tx) throw new Error('No transaction in quote response');

      const spender: `0x${string}` | undefined = quote.estimate?.approvalAddress ?? tx.to;
      if (spender) {
        setApprovalAddress(spender);
        const { data: allowance } = await refetchAllowance();
        const needed = BigInt(fromAmount);
        if (!allowance || (allowance as bigint) < needed) {
          setStatus('approving');
          const chain = CHAIN_MAP[vault.chainId as keyof typeof CHAIN_MAP];
          await writeContractAsync({
            address: vault.lifiTokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spender, needed],
            account: address,
            chain,
          });
          await new Promise<void>((resolve, reject) => {
            const t = setInterval(async () => {
              const { data: newAllowance } = await refetchAllowance();
              if (newAllowance && (newAllowance as bigint) >= needed) { clearInterval(t); resolve(); }
            }, 2000);
            setTimeout(() => { clearInterval(t); reject(new Error('Approval timeout')); }, 120_000);
          });
        }
      }

      setStatus('depositing');
      await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data,
        value: tx.value ? BigInt(tx.value) : undefined,
        chainId: vault.chainId as keyof typeof CHAIN_MAP,
      });
      setStatus('idle');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setErrorMsg(msg.includes('User rejected') ? 'Transaction rejected' : msg);
      setStatus('error');
    }
  }

  const isLifi = vault.source === 'lifi';
  const isBusy = status !== 'idle' && status !== 'error';

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{vault.protocol}</p>
              {isLifi && (
                <Tooltip>
                  <TooltipTrigger><Zap className="h-3 w-3 text-emerald-500" /></TooltipTrigger>
                  <TooltipContent>1-click deposit via LI.FI</TooltipContent>
                </Tooltip>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-tight truncate" title={vault.name}>{vault.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-xs px-1.5">{vault.network}</Badge>
            <Badge variant="secondary" className="text-xs px-1.5">{vault.token}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 flex flex-col gap-3">
        {/* APY */}
        <div className="flex items-end gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total APY</p>
            <p className="text-3xl font-bold text-emerald-500 leading-none">{formatApy(vault.apy)}</p>
          </div>
          {(vault.apyReward ?? 0) > 0 && (
            <>
              <div className="pb-0.5">
                <p className="text-xs text-muted-foreground mb-0.5">Base</p>
                <p className="text-sm font-medium">{formatApy(vault.apyBase)}</p>
              </div>
              <div className="pb-0.5">
                <p className="text-xs text-muted-foreground mb-0.5">Reward</p>
                <p className="text-sm font-medium text-amber-500">{formatApy(vault.apyReward)}</p>
              </div>
            </>
          )}
        </div>

        {/* TVL + snapshots */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>TVL <span className="text-foreground font-medium">{formatTvl(vault.tvl)}</span></span>
          {vault.apy30d != null && <span>30d <span className="text-foreground font-medium">{formatApy(vault.apy30d)}</span></span>}
          {vault.apy7d != null && <span>7d <span className="text-foreground font-medium">{formatApy(vault.apy7d)}</span></span>}
        </div>

        {/* User balance */}
        {isConnected && (
          <div className="flex items-center gap-1.5 rounded-lg bg-secondary/40 px-3 py-2">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Your balance:</span>
            <span className={`text-xs font-semibold ml-auto ${userDeposit > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
              {userDeposit > 0 ? `€${formatBalance(userDeposit)}` : '—'}
            </span>
          </div>
        )}

        {/* Tags */}
        {vault.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vault.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">{tag}</Badge>
            ))}
          </div>
        )}

        {/* Error */}
        {status === 'error' && errorMsg && (
          <p className="text-xs text-destructive truncate" title={errorMsg}>{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          {!isConnected ? (
            <div className="flex-1">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button size="sm" className="w-full" variant="outline" onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            </div>
          ) : isLifi && vault.isTransactional ? (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleDeposit}
              disabled={isBusy}
            >
              {BUTTON_LABEL[status]}
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" className="flex-1" variant="outline" asChild>
                  <a href={vault.protocolUrl} target="_blank" rel="noopener noreferrer">Open Protocol</a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deposit directly on {vault.protocol}</TooltipContent>
            </Tooltip>
          )}
          {vault.protocolUrl && (
            <Button size="sm" variant="ghost" asChild className="px-2">
              <a href={vault.protocolUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function VaultSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-9 w-full mt-2" />
    </Card>
  );
}

// ── Protocol deposit map ─────────────────────────────────────────────────────
// Maps protocolKey → total user deposit across all vaults of that protocol

function buildDepositMap(protocols: ReturnType<typeof useProtocolData>['protocols']) {
  const map: Record<string, number> = {};
  for (const p of protocols) {
    const key = p.id.split('-')[0]; // 'aave', 'morpho', 'summer', etc.
    map[key] = (map[key] ?? 0) + p.userDeposit;
    // Also handle grouped sub-protocols
    if (p.subProtocols) {
      for (const sub of p.subProtocols) {
        const subKey = sub.id.split('-')[0];
        // Don't double-count — grouped already sums subProtocols
        if (!map[subKey]) map[subKey] = 0;
      }
    }
  }
  return map;
}

// ── Main page ────────────────────────────────────────────────────────────────

const PROTOCOL_OPTIONS = [
  { value: 'all', label: 'All Protocols' },
  { value: 'Aave', label: 'Aave' },
  { value: 'Morpho', label: 'Morpho' },
  { value: 'YO', label: 'YO' },
  { value: 'Summer', label: 'Summer' },
  { value: 'Fluid', label: 'Fluid' },
  { value: 'Moonwell', label: 'Moonwell' },
  { value: 'Jupiter', label: 'Jupiter' },
];

function LiFiEarnInner() {
  const { vaults, isLoading: vaultsLoading, error } = useEuroooVaults();
  const { protocols, totalDeposits, averageApy, isLoading: portfolioLoading } = useProtocolData();
  const [selectedProtocol, setSelectedProtocol] = useState('all');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy');

  const depositMap = buildDepositMap(protocols);

  const filtered = vaults
    .filter((v) => selectedProtocol === 'all' || v.protocol === selectedProtocol)
    .sort((a, b) => sortBy === 'apy' ? b.apy - a.apy : b.tvl - a.tvl);

  const isLoading = vaultsLoading || portfolioLoading;

  return (
    <main className="flex-1 container px-4 py-10 max-w-6xl mx-auto">

      {/* Hero */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              EUR Stablecoin Yield
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Earn on Your Euros</h1>
          <p className="text-muted-foreground text-sm">
            {vaultsLoading ? 'Fetching vaults…' : `${vaults.length} positions across 7 protocols.`}
          </p>
        </div>
        <Suspense fallback={null}>
          <ConnectButton
            showBalance={false}
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
          />
        </Suspense>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary
        totalDeposits={totalDeposits}
        averageApy={averageApy}
        isLoading={isLoading}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Protocol" />
          </SelectTrigger>
          <SelectContent>
            {PROTOCOL_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => setSortBy(sortBy === 'apy' ? 'tvl' : 'apy')}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort: {sortBy === 'apy' ? 'APY' : 'TVL'}
        </Button>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} vault{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {error ? (
        <div className="text-center py-20 text-muted-foreground">Failed to load vaults. Please try again.</div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <VaultSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No vaults found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              userDeposit={depositMap[vault.protocolKey] ?? 0}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span>1-click deposit powered by LI.FI · Other protocols open directly on their platform</span>
      </div>
    </main>
  );
}

export default function LiFiEarn() {
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <SEO
          title="EUR Yield — Powered by LI.FI"
          description="Discover EUR stablecoin vaults across Aave, Morpho, YO, Summer, Fluid, Moonwell and Jupiter."
          path="/lifi"
        />
        <Header />
        <WagmiReadyGuard>
          <LiFiEarnInner />
        </WagmiReadyGuard>
        <Footer />
      </div>
    </WalletProvider>
  );
}
