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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowUpDown, ExternalLink, TrendingUp, Zap, Wallet, ArrowDown } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAccount, useChainId, useSwitchChain, useWriteContract, useReadContract, useSendTransaction } from 'wagmi';
import { mainnet, base, gnosis, avalanche, arbitrum, optimism, polygon } from 'wagmi/chains';
import { ERC20_ABI } from '@/lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CHAIN_MAP = {
  1: mainnet,
  8453: base,
  100: gnosis,
  43114: avalanche,
  42161: arbitrum,
  10: optimism,
  137: polygon,
} as const;

const COMPOSER_API = '/lifi-composer';
const LIFI_API_KEY = import.meta.env.VITE_LIFI_API_KEY as string;

// ── From-chain / From-token registry ────────────────────────────────────────

interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
}

const FROM_CHAINS = [
  { id: 1,     name: 'Ethereum' },
  { id: 8453,  name: 'Base' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10,    name: 'Optimism' },
  { id: 137,   name: 'Polygon' },
  { id: 43114, name: 'Avalanche' },
];

const NATIVE = '0x0000000000000000000000000000000000000000';

const FROM_TOKENS: Record<number, TokenOption[]> = {
  1: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6  },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6  },
    { symbol: 'EURC', address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c', decimals: 6  },
    { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  ],
  8453: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6  },
    { symbol: 'EURC', address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6  },
  ],
  42161: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6  },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6  },
  ],
  10: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6  },
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6  },
  ],
  137: [
    { symbol: 'POL',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6  },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6  },
  ],
  43114: [
    { symbol: 'AVAX', address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6  },
  ],
};

// ── Formatters ───────────────────────────────────────────────────────────────

function formatApy(val: number | null | undefined) {
  if (val == null) return '—';
  return `${val.toFixed(2)}%`;
}

function formatTvl(usd: number) {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000)         return `$${(usd / 1_000).toFixed(1)}K`;
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

  const daily   = (totalDeposits * (averageApy / 100)) / 365;
  const weekly  = daily * 7;
  const yearly  = totalDeposits * (averageApy / 100);
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

// ── Deposit Modal ────────────────────────────────────────────────────────────

type QuoteStatus = 'idle' | 'loading' | 'success' | 'error';
type TxStatus = 'idle' | 'switching' | 'approving' | 'depositing' | 'done' | 'error';

const TX_LABEL: Record<TxStatus, string> = {
  idle:       'Deposit',
  switching:  'Switching chain…',
  approving:  'Approving token…',
  depositing: 'Confirm in wallet…',
  done:       'Done!',
  error:      'Retry',
};

interface DepositModalProps {
  vault: UnifiedVault;
  onClose: () => void;
}

function DepositModal({ vault, onClose }: DepositModalProps) {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const defaultChainId = vault.chainId && FROM_CHAINS.some(c => c.id === vault.chainId)
    ? vault.chainId
    : 1;
  const [fromChainId, setFromChainId] = useState<number>(defaultChainId);
  const [fromToken, setFromToken] = useState<TokenOption>(FROM_TOKENS[defaultChainId]?.[0] ?? FROM_TOKENS[1][0]);
  const [amount, setAmount] = useState('');

  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState('');

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState('');

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
    setFromToken(FROM_TOKENS[cid]?.[0] ?? FROM_TOKENS[1][0]);
    resetQuote();
  }

  function handleTokenChange(symbol: string) {
    const t = FROM_TOKENS[fromChainId]?.find((x) => x.symbol === symbol);
    if (t) { setFromToken(t); resetQuote(); }
  }

  function resetQuote() {
    setQuote(null);
    setQuoteStatus('idle');
    setTxStatus('idle');
    setTxError('');
  }

  async function getQuote() {
    if (!address || !vault.chainId || !vault.lifiAddress || !amount || parseFloat(amount) <= 0) return;
    setQuoteStatus('loading');
    setQuoteError('');
    try {
      const fromAmount = String(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
      const params = new URLSearchParams({
        fromChain:   String(fromChainId),
        toChain:     String(vault.chainId),
        fromToken:   fromToken.address,
        toToken:     vault.lifiAddress,
        fromAddress: address,
        toAddress:   address,
        fromAmount,
      });
      const res = await fetch(`${COMPOSER_API}/v1/quote?${params}`, {
        headers: { 'x-lifi-api-key': LIFI_API_KEY },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Quote failed: ${res.status}`);
      }
      setQuote(await res.json());
      setQuoteStatus('success');
    } catch (e: unknown) {
      setQuoteError(e instanceof Error ? e.message : 'Failed to get quote');
      setQuoteStatus('error');
    }
  }

  async function executeDeposit() {
    if (!quote || !address) return;
    setTxError('');

    try {
      // 1. Switch to fromChain
      setTxStatus('switching');
      await switchChainAsync({ chainId: fromChainId });

      // 2. Approve ERC20 if needed
      if (!isNative && approvalAddress) {
        const fromAmount = String(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
        const needed = BigInt(fromAmount);
        const { data: allowance } = await refetchAllowance();
        if (!allowance || (allowance as bigint) < needed) {
          setTxStatus('approving');
          const chain = CHAIN_MAP[fromChainId as keyof typeof CHAIN_MAP];
          await writeContractAsync({
            address: fromToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [approvalAddress, needed],
            account: address,
            chain,
          });
          // Poll until approval is reflected
          await new Promise<void>((resolve, reject) => {
            const t = setInterval(async () => {
              const { data: fresh } = await refetchAllowance();
              if (fresh && (fresh as bigint) >= needed) { clearInterval(t); resolve(); }
            }, 2000);
            setTimeout(() => { clearInterval(t); reject(new Error('Approval timeout')); }, 120_000);
          });
        }
      }

      // 3. Send the deposit transaction
      setTxStatus('depositing');
      const tx = quote.transactionRequest;
      await sendTransactionAsync({
        to:      tx.to as `0x${string}`,
        data:    tx.data,
        value:   tx.value ? BigInt(tx.value) : undefined,
        chainId: fromChainId,
      });

      setTxStatus('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setTxError(msg.includes('User rejected') ? 'Transaction rejected' : msg);
      setTxStatus('error');
    }
  }

  // ── Derived quote display values ─────────────────────────────────────────
  const estOutput = quote?.estimate?.toAmount
    ? (Number(quote.estimate.toAmount) / 10 ** (vault.lifiTokenDecimals ?? 6)).toFixed(4)
    : null;
  const estTimeSec: number = quote?.estimate?.executionDuration ?? 0;
  const estTime = estTimeSec > 0
    ? estTimeSec < 60 ? `~${estTimeSec}s` : `~${Math.ceil(estTimeSec / 60)} min`
    : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFeeUsd = ((quote?.estimate?.feeCosts ?? []) as any[])
    .reduce((s: number, f) => s + Number(f.amountUSD ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps: any[] = quote?.includedSteps ?? [];

  const isBusy = txStatus !== 'idle' && txStatus !== 'done' && txStatus !== 'error';
  const isCrossChain = fromChainId !== vault.chainId;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit into {vault.name}</DialogTitle>
          <DialogDescription>
            {vault.protocol} · {vault.network} · {formatApy(vault.apy)} APY
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">

          {/* FROM section */}
          <div className="rounded-lg border border-border/60 p-3 flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</p>
            <div className="flex gap-2">
              <Select value={String(fromChainId)} onValueChange={handleChainChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FROM_CHAINS.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fromToken.symbol} onValueChange={handleTokenChange}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(FROM_TOKENS[fromChainId] ?? []).map((t) => (
                    <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                min="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); resetQuote(); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                {fromToken.symbol}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="rounded-full bg-secondary p-1.5">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* TO section */}
          <div className="rounded-lg border border-border/60 p-3 flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">To</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{vault.token}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs">{vault.network}</Badge>
                <Badge variant="secondary" className="text-xs">{formatApy(vault.apy)} APY</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{vault.protocol} · {vault.name}</p>
            {isCrossChain && (
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                <Zap className="h-3 w-3" />
                <span>Cross-chain — LI.FI bridges automatically</span>
              </div>
            )}
          </div>

          {/* Get Quote */}
          {quoteStatus !== 'success' && (
            <Button
              onClick={getQuote}
              disabled={!amount || parseFloat(amount) <= 0 || quoteStatus === 'loading'}
              variant="outline"
              className="w-full"
            >
              {quoteStatus === 'loading' ? 'Getting quote…' : 'Get Quote'}
            </Button>
          )}

          {quoteStatus === 'error' && (
            <p className="text-xs text-destructive">{quoteError}</p>
          )}

          {/* Quote result */}
          {quoteStatus === 'success' && quote && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Route</p>

              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                  <span className="capitalize font-medium">{step.type}</span>
                  {step.toolDetails?.name && (
                    <span className="text-muted-foreground">via {step.toolDetails.name}</span>
                  )}
                </div>
              ))}

              <div className="border-t border-border/40 pt-2 mt-1 flex flex-col gap-1.5">
                {estOutput && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">You receive</span>
                    <span className="font-semibold text-emerald-500">~{estOutput} {vault.token}</span>
                  </div>
                )}
                {totalFeeUsd > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Fees</span>
                    <span>~${totalFeeUsd.toFixed(2)}</span>
                  </div>
                )}
                {estTime && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. time</span>
                    <span>{estTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tx error */}
          {txStatus === 'error' && txError && (
            <p className="text-xs text-destructive">{txError}</p>
          )}

          {/* Action buttons */}
          {quoteStatus === 'success' && (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={executeDeposit}
                disabled={isBusy || txStatus === 'done'}
              >
                {txStatus === 'done' ? '✓ Deposited' : TX_LABEL[txStatus]}
              </Button>
              {txStatus !== 'done' && (
                <Button variant="ghost" size="sm" className="text-xs w-full" onClick={resetQuote}>
                  Change amount / token
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Vault Card ───────────────────────────────────────────────────────────────

interface VaultCardProps {
  vault: UnifiedVault;
  userDeposit: number;
  onDeposit: (vault: UnifiedVault) => void;
}

function VaultCard({ vault, userDeposit, onDeposit }: VaultCardProps) {
  const { isConnected } = useAccount();
  const isLifi = vault.source === 'lifi';

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
                  <TooltipContent>Cross-chain deposit via LI.FI</TooltipContent>
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
          {vault.apy7d  != null && <span>7d  <span className="text-foreground font-medium">{formatApy(vault.apy7d)}</span></span>}
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
              onClick={() => onDeposit(vault)}
            >
              Deposit
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

function buildDepositMap(protocols: ReturnType<typeof useProtocolData>['protocols']) {
  const map: Record<string, number> = {};
  for (const p of protocols) {
    const key = p.id.split('-')[0];
    map[key] = (map[key] ?? 0) + p.userDeposit;
  }
  return map;
}

// ── Main page ────────────────────────────────────────────────────────────────

const PROTOCOL_OPTIONS = [
  { value: 'all',      label: 'All Protocols' },
  { value: 'Aave',     label: 'Aave' },
  { value: 'Morpho',   label: 'Morpho' },
  { value: 'YO',       label: 'YO' },
  { value: 'Summer',   label: 'Summer' },
  { value: 'Fluid',    label: 'Fluid' },
  { value: 'Moonwell', label: 'Moonwell' },
  { value: 'Jupiter',  label: 'Jupiter' },
];

function LiFiEarnInner() {
  const { vaults, isLoading: vaultsLoading, error } = useEuroooVaults();
  const { protocols, totalDeposits, averageApy, isLoading: portfolioLoading } = useProtocolData();
  const [selectedProtocol, setSelectedProtocol] = useState('all');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl'>('apy');
  const [depositVault, setDepositVault] = useState<UnifiedVault | null>(null);

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
              onDeposit={setDepositVault}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span>Cross-chain deposit powered by LI.FI · Other protocols open directly on their platform</span>
      </div>

      {/* Deposit Modal */}
      {depositVault && (
        <DepositModal
          vault={depositVault}
          onClose={() => setDepositVault(null)}
        />
      )}
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
