import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/components/WalletProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Zap } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useLiFiVaults, LiFiVault } from '@/hooks/useLiFiVaults';
import { useAccount, useSwitchChain, useWriteContract, useSendTransaction, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FROM_CHAINS, FROM_TOKENS, NATIVE, type TokenOption } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/contracts';
import aaveLogo from '@/assets/aave-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';
import yoLogo from '@/assets/yo-logo.png';
import fluidLogo from '@/assets/fluid-logo.png';
import moonwellLogo from '@/assets/moonwell-logo.png';

// ── Constants ─────────────────────────────────────────────────────────────────

const COMPOSER_API = '/lifi-composer';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY as string;

const PROTOCOL_LOGOS: Record<string, string> = {
  'aave-v3':     aaveLogo,
  'morpho-v1':   morphoLogo,
  'yo-protocol': yoLogo,
  'fluid':       fluidLogo,
  'moonwell':    moonwellLogo,
};

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

// ── Deposit Modal ─────────────────────────────────────────────────────────────

type Step = 'idle' | 'quoting' | 'quoted' | 'switching' | 'approving' | 'depositing' | 'done' | 'error';

function DepositModal({ vault, onClose }: { vault: LiFiVault; onClose: () => void }) {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [fromChainId, setFromChainId] = useState<number>(vault.chainId ?? 8453);
  const [fromToken, setFromToken] = useState<TokenOption>(
    FROM_TOKENS[vault.chainId ?? 8453]?.[0] ?? FROM_TOKENS[8453][0]
  );
  const [amount, setAmount] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any>(null);
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isNative = fromToken.address === NATIVE;
  const approvalAddress = quote?.estimate?.approvalAddress as `0x${string}` | undefined;

  const { refetch: refetchAllowance } = useReadContract({
    address: !isNative ? (fromToken.address as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && approvalAddress ? [address, approvalAddress] : undefined,
    query: { enabled: false },
  });

  function handleChainChange(val: string) {
    const cid = Number(val);
    setFromChainId(cid);
    setFromToken(FROM_TOKENS[cid]?.[0] ?? FROM_TOKENS[8453][0]);
    setQuote(null);
    setStep('idle');
    setAmount('');
  }

  function handleTokenChange(symbol: string) {
    const t = FROM_TOKENS[fromChainId]?.find(x => x.symbol === symbol);
    if (t) { setFromToken(t); setQuote(null); setStep('idle'); }
  }

  async function getQuote() {
    if (!address || !vault.chainId || !amount || parseFloat(amount) <= 0) return;
    setStep('quoting');
    setErrorMsg('');
    try {
      const fromAmount = String(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
      const params = new URLSearchParams({
        fromChain:   String(fromChainId),
        toChain:     String(vault.chainId),
        fromToken:   fromToken.address,
        toToken:     vault.address,   // vault.address from Earn API = toToken for Composer
        fromAddress: address,
        toAddress:   address,
        fromAmount,
      });
      const res = await fetch(`${COMPOSER_API}/v1/quote?${params}`, {
        headers: LIFI_API_KEY ? { 'x-lifi-api-key': LIFI_API_KEY } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Quote failed: ${res.status}`);
      }
      const q = await res.json();
      console.log('[LI.FI Composer] quote:', q);
      setQuote(q);
      setStep('quoted');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to get quote');
      setStep('error');
    }
  }

  async function executeDeposit() {
    if (!quote || !address) return;
    setErrorMsg('');
    try {
      // 1. Switch to source chain
      setStep('switching');
      await switchChainAsync({ chainId: fromChainId as (typeof FROM_CHAINS)[number]['id'] });

      // 2. Approve ERC20 spend if needed
      if (!isNative && approvalAddress) {
        const needed = BigInt(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
        const { data: allowance } = await refetchAllowance();
        if (!allowance || (allowance as bigint) < needed) {
          setStep('approving');
          await writeContractAsync({
            address: fromToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [approvalAddress, needed],
          });
          // Wait for approval to be mined
          await new Promise<void>((resolve, reject) => {
            const poll = setInterval(async () => {
              const { data: fresh } = await refetchAllowance();
              if (fresh && (fresh as bigint) >= needed) { clearInterval(poll); resolve(); }
            }, 2000);
            setTimeout(() => { clearInterval(poll); reject(new Error('Approval timeout')); }, 120_000);
          });
        }
      }

      // 3. Send the transaction exactly as returned by Composer
      setStep('depositing');
      const tx = quote.transactionRequest;
      await sendTransactionAsync({
        to:      tx.to as `0x${string}`,
        data:    tx.data,
        value:   tx.value ? BigInt(tx.value) : undefined,
        chainId: fromChainId as (typeof FROM_CHAINS)[number]['id'],
        gas:     tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
      });

      setStep('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transaction failed';
      setErrorMsg(msg.includes('User rejected') ? 'Transaction cancelled' : msg);
      setStep('error');
    }
  }

  // Quote display values
  const toDecimals: number = quote?.action?.toToken?.decimals ?? vault.underlyingTokens[0]?.decimals ?? 18;
  const received = quote?.estimate?.toAmount
    ? (Number(quote.estimate.toAmount) / 10 ** toDecimals).toFixed(4)
    : null;
  const durationSec: number = quote?.estimate?.executionDuration ?? 0;
  const duration = durationSec > 0
    ? durationSec < 60 ? `~${durationSec}s` : `~${Math.ceil(durationSec / 60)} min`
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feesUsd = ((quote?.estimate?.feeCosts ?? []) as any[])
    .reduce((s: number, f) => s + Number(f.amountUSD ?? 0), 0);

  const busy = step === 'quoting' || step === 'switching' || step === 'approving' || step === 'depositing';

  const stepLabel: Record<Step, string> = {
    idle:       'Get Quote',
    quoting:    'Getting quote…',
    quoted:     'Confirm Deposit',
    switching:  'Switching network…',
    approving:  'Approving token…',
    depositing: 'Confirm in wallet…',
    done:       'Done!',
    error:      'Retry',
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogTitle>Deposit into {vault.name}</DialogTitle>

        {!address ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-sm text-muted-foreground text-center">Connect your wallet to deposit.</p>
            <ConnectButton />
          </div>
        ) : step === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="text-3xl">✓</div>
            <p className="font-semibold">Deposit submitted!</p>
            <p className="text-sm text-muted-foreground text-center">
              LI.FI is processing your deposit. It may take a few minutes for funds to appear in the vault.
            </p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {/* From chain + token */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
              <div className="flex gap-2">
                <Select value={String(fromChainId)} onValueChange={handleChainChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FROM_CHAINS.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={fromToken.symbol} onValueChange={handleTokenChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(FROM_TOKENS[fromChainId] ?? []).map(t => (
                      <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setQuote(null); setStep('idle'); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Quote result */}
            {step === 'quoted' && received && (
              <div className="rounded-lg bg-muted/40 border border-border/50 p-3 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-medium">{received} {vault.underlyingTokens[0]?.symbol ?? 'shares'}</span>
                </div>
                {duration && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. time</span>
                    <span>{duration}</span>
                  </div>
                )}
                {feesUsd > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span>~${feesUsd.toFixed(2)}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border/40">
                  Powered by LI.FI Composer — swap + deposit in one transaction.
                </p>
              </div>
            )}

            {/* Error */}
            {step === 'error' && errorMsg && (
              <p className="text-sm text-red-500 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                {errorMsg}
              </p>
            )}

            {/* Action button */}
            <Button
              className="w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={busy || !amount || parseFloat(amount) <= 0 || step === 'done'}
              onClick={step === 'quoted' ? executeDeposit : getQuote}
            >
              {stepLabel[step]}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Vault row ─────────────────────────────────────────────────────────────────

function VaultRow({ vault, onDeposit }: { vault: LiFiVault; onDeposit: () => void }) {
  const logo = PROTOCOL_LOGOS[vault.protocol.name];
  const chainLabel = CHAIN_LABELS[vault.chainId] ?? vault.network;
  const token = vault.underlyingTokens[0];
  const apy = vault.analytics.apy.total ?? 0;
  const tvl = Number(vault.analytics.tvl.usd);
  const isYo = vault.protocol.name === 'yo-protocol' && vault.isTransactional;

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
        {fmt(vault.analytics.apy7d)}
      </td>

      {/* 30d APY */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {fmt(vault.analytics.apy30d)}
      </td>

      {/* TVL */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {fmtTvl(tvl)}
      </td>

      {/* Deposit — YO only */}
      <td className="px-4 py-3">
        {isYo ? (
          <Button
            size="sm"
            onClick={onDeposit}
            className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
          >
            <Zap className="w-3 h-3" />
            Deposit
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
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
          {Array.from({ length: 9 }).map((_, j) => (
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
  const [depositVault, setDepositVault] = useState<LiFiVault | null>(null);

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
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Deposit</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Link</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows />
            ) : vaults.length === 0 && !error ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No EUR vaults found.
                </td>
              </tr>
            ) : (
              vaults.map(v => (
                <VaultRow key={v.slug} vault={v} onDeposit={() => setDepositVault(v)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Deposit modal */}
      {depositVault && (
        <DepositModal vault={depositVault} onClose={() => setDepositVault(null)} />
      )}
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
