import { useState, Suspense, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WalletProvider } from '@/components/WalletProvider';
import { WagmiReadyGuard } from '@/components/WagmiReadyGuard';
import { useEuroooVaults, UnifiedVault } from '@/hooks/useEuroooVaults';
import { useProtocolData } from '@/hooks/useProtocolData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, ExternalLink, TrendingUp, Zap, Wallet, ArrowDown } from 'lucide-react';
import aaveLogo from '@/assets/aave-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';
import yoLogo from '@/assets/yo-logo.png';
import summerLogo from '@/assets/summer-logo.png';
import fluidLogo from '@/assets/fluid-logo.png';
import moonwellLogo from '@/assets/moonwell-logo.png';
import jupiterLogo from '@/assets/jupiter-logo.png';
import { SEO } from '@/components/SEO';
import { useAccount, useSwitchChain, useWriteContract, useReadContract, useSendTransaction, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { mainnet, base, gnosis, avalanche, arbitrum, optimism, polygon } from 'wagmi/chains';
import { ERC20_ABI } from '@/lib/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEurUsdRate } from '@/hooks/useEurUsdRate';
import { useWalletAssets, useEthPriceUsd } from '@/hooks/useWalletAssets';
import { FROM_CHAINS, FROM_TOKENS, NATIVE, type TokenOption } from '@/lib/tokens';

const PROTOCOL_LOGOS: Record<string, string> = {
  aave:     aaveLogo,
  morpho:   morphoLogo,
  yo:       yoLogo,
  summer:   summerLogo,
  fluid:    fluidLogo,
  moonwell: moonwellLogo,
  jupiter:  jupiterLogo,
};

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
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  initialFromToken?: { chainId: number; symbol: string };
}

// Hook: reads balance of currently-selected token on currently-selected chain
function useSelectedTokenBalance(chainId: number, token: TokenOption, userAddress?: `0x${string}`) {
  const isNative = token.address === NATIVE;
  const { data: nativeBal } = useBalance({
    address: userAddress,
    chainId: chainId as (typeof FROM_CHAINS)[number]['id'],
    query: { enabled: !!userAddress && isNative, staleTime: 15_000 },
  });
  const { data: erc20Bal } = useReadContract({
    address: !isNative ? (token.address as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: chainId as (typeof FROM_CHAINS)[number]['id'],
    query: { enabled: !!userAddress && !isNative, staleTime: 15_000 },
  });
  if (isNative) return nativeBal ? Number(nativeBal.formatted) : 0;
  return erc20Bal ? Number(formatUnits(erc20Bal as bigint, token.decimals)) : 0;
}

function DepositModal({ vault, onClose, initialFromToken }: DepositModalProps) {
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: rateData } = useEurUsdRate();
  const eurRate = rateData?.current ?? 0.92;
  const { data: ethPrice = 0 } = useEthPriceUsd();
  const walletAssets = useWalletAssets();

  const defaultChainId = initialFromToken?.chainId
    ?? (vault.chainId && FROM_CHAINS.some(c => c.id === vault.chainId) ? vault.chainId : 1);
  const defaultToken = initialFromToken
    ? (FROM_TOKENS[initialFromToken.chainId]?.find(t => t.symbol === initialFromToken.symbol) ?? FROM_TOKENS[1][0])
    : (FROM_TOKENS[defaultChainId]?.[0] ?? FROM_TOKENS[1][0]);
  const [fromChainId, setFromChainId] = useState<number>(defaultChainId);
  const [fromToken, setFromToken] = useState<TokenOption>(defaultToken);
  const [amount, setAmount] = useState('');
  const [walletPrefilled, setWalletPrefilled] = useState(false);

  // Auto-select highest-balance wallet token once breakdown loads
  useEffect(() => {
    if (walletPrefilled || walletAssets.breakdown.length === 0) return;
    const top = walletAssets.breakdown[0];
    const tok = FROM_TOKENS[top.chainId]?.find(t => t.symbol === top.symbol);
    if (!tok) return;
    setFromChainId(top.chainId);
    setFromToken(tok);
    setAmount(top.balance.toFixed(6).replace(/\.?0+$/, ''));
    setWalletPrefilled(true);
  }, [walletAssets.breakdown, walletPrefilled]);

  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [quote, setQuote] = useState<any>(null);
  const [quoteError, setQuoteError] = useState('');

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState('');

  const isNative = fromToken.address === NATIVE;
  const approvalAddress = quote?.estimate?.approvalAddress as `0x${string}` | undefined;

  // Live balance for selected token/chain
  const selectedBalance = useSelectedTokenBalance(fromChainId, fromToken, address);

  // EUR equivalent of current amount
  const amountNum = parseFloat(amount) || 0;
  const isUsdStable = ['USDC', 'USDT', 'DAI'].includes(fromToken.symbol);
  const isEurc = fromToken.symbol === 'EURC';
  const isEthLike = ['ETH'].includes(fromToken.symbol);
  const eurEquiv = isEurc ? amountNum
    : isUsdStable ? amountNum * eurRate
    : isEthLike ? amountNum * ethPrice * eurRate
    : null; // POL/AVAX — no price available, skip

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
    setAmount('');
  }

  function handleTokenChange(symbol: string) {
    const t = FROM_TOKENS[fromChainId]?.find((x) => x.symbol === symbol);
    if (t) { setFromToken(t); resetQuote(); setAmount(''); }
  }

  function handleWalletChip(item: typeof walletAssets.breakdown[0]) {
    const cid = item.chainId;
    const tok = FROM_TOKENS[cid]?.find(t => t.symbol === item.symbol) ?? FROM_TOKENS[cid]?.[0];
    if (!tok) return;
    setFromChainId(cid);
    setFromToken(tok);
    setAmount(item.balance.toFixed(6).replace(/\.?0+$/, ''));
    resetQuote();
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
      await switchChainAsync({ chainId: fromChainId as (typeof FROM_CHAINS)[number]['id'] });

      // 2. Approve ERC20 if needed
      if (!isNative && approvalAddress) {
        const fromAmount = String(Math.floor(parseFloat(amount) * 10 ** fromToken.decimals));
        const needed = BigInt(fromAmount);
        const { data: allowance } = await refetchAllowance();
        if (!allowance || (allowance as bigint) < needed) {
          setTxStatus('approving');
          await writeContractAsync({
            address: fromToken.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [approvalAddress, needed],
            account: address,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            chain: (CHAIN_MAP as any)[fromChainId],
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
        chainId: fromChainId as (typeof FROM_CHAINS)[number]['id'],
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
      <DialogContent className="max-w-md max-h-[90dvh] flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 shrink-0 pr-12">
          <DialogHeader>
            <DialogTitle>One-click deposit — {vault.name}</DialogTitle>
            <DialogDescription>
              {vault.protocol} · {vault.network} · {formatApy(vault.apy)} APY
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto min-h-0 px-6 pb-6">

          {/* Wallet balance dropdown */}
          {walletAssets.breakdown.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Pay from wallet</p>
              <Select
                value={walletAssets.breakdown.findIndex(
                  i => i.chainId === fromChainId && i.symbol === fromToken.symbol
                ).toString()}
                onValueChange={(val) => {
                  const item = walletAssets.breakdown[Number(val)];
                  if (item) handleWalletChip(item);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a token from your wallet…" />
                </SelectTrigger>
                <SelectContent>
                  {walletAssets.breakdown.map((item, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      <span className="flex items-center justify-between gap-3 w-full">
                        <span>
                          <span className="font-semibold">{item.symbol}</span>
                          <span className="text-muted-foreground ml-1.5 text-xs">{item.chainName}</span>
                        </span>
                        <span className="text-xs font-medium ml-4">
                          {item.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                          {item.amountUsd > 0 && (
                            <span className="text-muted-foreground ml-1">
                              (${item.amountUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })})
                            </span>
                          )}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* FROM section */}
          <div className="rounded-lg border border-border/60 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</p>
              {selectedBalance > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Balance: {selectedBalance.toLocaleString('en-US', { maximumFractionDigits: 6 })} {fromToken.symbol}
                </span>
              )}
            </div>
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
            <div className="flex flex-col gap-1">
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); resetQuote(); }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-24"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {selectedBalance > 0 && (
                    <button
                      onClick={() => { setAmount(selectedBalance.toFixed(8).replace(/\.?0+$/, '')); resetQuote(); }}
                      className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 uppercase tracking-wide"
                    >
                      MAX
                    </button>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">{fromToken.symbol}</span>
                </div>
              </div>
              {eurEquiv !== null && amountNum > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  ≈ €{eurEquiv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
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
            <p className="text-xs text-muted-foreground mt-1">
              We handle everything. Your {fromToken.symbol} arrives as EUR, earning yield immediately.
            </p>
          </div>

          {/* Get Quote */}
          {quoteStatus !== 'success' && (
            <Button
              onClick={getQuote}
              disabled={!amount || parseFloat(amount) <= 0 || quoteStatus === 'loading'}
              variant="outline"
              className="w-full"
            >
              {quoteStatus === 'loading' ? 'Calculating…' : 'Preview deposit'}
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
                    <span className="text-muted-foreground">EUR deposited into vault</span>
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

// ── Vault Table ──────────────────────────────────────────────────────────────

interface ProtocolGroup {
  protocolKey: string;
  protocol: string;
  bestApy: number;
  totalTvl: number;
  userDeposit: number;
  vaults: UnifiedVault[];
}

interface VaultRowProps {
  vault: UnifiedVault;
  userDeposit: number;
  onDeposit: (vault: UnifiedVault) => void;
}

function VaultSubRow({ vault, userDeposit, onDeposit }: VaultRowProps) {
  const { isConnected } = useAccount();
  const isLifi = vault.source === 'lifi';
  return (
    <div className="bg-secondary/20 border-t border-border/20 px-4 md:px-6 py-3">
      {/* Mobile layout */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5">{vault.network}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5">{vault.token}</Badge>
            <span className="text-emerald-500 font-semibold text-xs">{formatApy(vault.apy)}</span>
          </div>
          <span className="text-xs text-muted-foreground truncate">{vault.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isLifi && vault.isTransactional ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2" onClick={() => onDeposit(vault)}>
              Deposit
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" asChild>
              <a href={vault.protocolUrl} target="_blank" rel="noopener noreferrer">Open</a>
            </Button>
          )}
        </div>
      </div>
      {/* Desktop layout */}
      <div className="hidden md:grid grid-cols-12 gap-4 items-center text-sm pl-10">
        <div className="col-span-4 flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-medium truncate text-muted-foreground">{vault.name}</span>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5">{vault.network}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5">{vault.token}</Badge>
            {isLifi && (
              <Tooltip>
                <TooltipTrigger><Zap className="h-2.5 w-2.5 text-emerald-500" /></TooltipTrigger>
                <TooltipContent>1-click deposit</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="col-span-2 text-emerald-500 font-semibold">{formatApy(vault.apy)}</div>
        <div className="col-span-2 text-muted-foreground text-xs">{formatTvl(vault.tvl)}</div>
        <div className="col-span-2 text-xs">
          {isConnected ? (
            <span className={userDeposit > 0 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
              {userDeposit > 0 ? `€${formatBalance(userDeposit)}` : '—'}
            </span>
          ) : '—'}
        </div>
        <div className="col-span-2 flex justify-end gap-1">
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={openConnectModal}>Connect</Button>
              )}
            </ConnectButton.Custom>
          ) : isLifi && vault.isTransactional ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7" onClick={() => onDeposit(vault)}>
              One-click deposit
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-xs h-7" asChild>
              <a href={vault.protocolUrl} target="_blank" rel="noopener noreferrer">Open</a>
            </Button>
          )}
          {vault.protocolUrl && (
            <Button size="sm" variant="ghost" className="px-1.5 h-7" asChild>
              <a href={vault.protocolUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProtocolGroupRowProps {
  group: ProtocolGroup;
  depositMap: Record<string, number>;
  isExpanded: boolean;
  onToggle: () => void;
  onDeposit: (vault: UnifiedVault) => void;
}

function ProtocolGroupRow({ group, depositMap, isExpanded, onToggle, onDeposit }: ProtocolGroupRowProps) {
  const hasDeposit = group.userDeposit > 0;
  const logo = PROTOCOL_LOGOS[group.protocolKey];
  const multiVault = group.vaults.length > 1;

  return (
    <div className={hasDeposit ? 'border-l-2 border-l-emerald-500' : ''}>
      {/* Protocol header row */}
      <button
        className="w-full px-4 md:px-6 py-4 hover:bg-secondary/30 transition-colors text-left"
        onClick={multiVault ? onToggle : undefined}
        style={{ cursor: multiVault ? 'pointer' : 'default' }}
      >
        {/* Mobile layout */}
        <div className="flex items-center gap-3 md:hidden">
          {logo && (
            <img src={logo} alt={group.protocol} className="h-8 w-8 rounded-lg object-contain bg-secondary/40 p-1 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{group.protocol}</span>
              {multiVault && (
                <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1 py-0.5">
                  {group.vaults.length} vaults
                </span>
              )}
              {multiVault && (isExpanded
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-emerald-500 font-bold text-xs">{formatApy(group.bestApy)}</span>
              <span className="text-muted-foreground text-xs">{formatTvl(group.totalTvl)}</span>
              {hasDeposit && <span className="text-emerald-500 text-xs font-semibold">€{formatBalance(group.userDeposit)}</span>}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {!multiVault && group.vaults[0] && (
              group.vaults[0].source === 'lifi' && group.vaults[0].isTransactional ? (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2"
                  onClick={() => onDeposit(group.vaults[0])}>
                  Deposit
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-xs h-7 px-2" asChild>
                  <a href={group.vaults[0].protocolUrl} target="_blank" rel="noopener noreferrer">Open</a>
                </Button>
              )
            )}
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:grid grid-cols-12 gap-4 items-center text-sm">
          <div className="col-span-4 flex items-center gap-3">
            {logo && (
              <img src={logo} alt={group.protocol} className="h-8 w-8 rounded-lg object-contain bg-secondary/40 p-1 shrink-0" />
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold">{group.protocol}</span>
              {multiVault && (
                <span className="text-[10px] text-muted-foreground bg-secondary rounded px-1 py-0.5">
                  {group.vaults.length} vaults
                </span>
              )}
            </div>
            {multiVault && (
              isExpanded
                ? <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            )}
          </div>
          <div className="col-span-2 text-emerald-500 font-bold">{formatApy(group.bestApy)}</div>
          <div className="col-span-2 text-muted-foreground">{formatTvl(group.totalTvl)}</div>
          <div className="col-span-2">
            {hasDeposit ? (
              <span className="text-emerald-500 font-semibold">€{formatBalance(group.userDeposit)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="col-span-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
            {!multiVault && group.vaults[0] && (
              group.vaults[0].source === 'lifi' && group.vaults[0].isTransactional ? (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                  onClick={() => onDeposit(group.vaults[0])}>
                  One-click deposit
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                  <a href={group.vaults[0].protocolUrl} target="_blank" rel="noopener noreferrer">Open</a>
                </Button>
              )
            )}
            {multiVault && (
              <span className="text-xs text-muted-foreground">
                {isExpanded ? 'Collapse' : 'View vaults'}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded sub-rows */}
      {isExpanded && multiVault && group.vaults.map((vault) => (
        <VaultSubRow
          key={vault.id}
          vault={vault}
          userDeposit={depositMap[vault.protocolKey] ?? 0}
          onDeposit={onDeposit}
        />
      ))}
    </div>
  );
}

function VaultTableSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
          <div className="col-span-4 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-2"><Skeleton className="h-4 w-12" /></div>
          <div className="col-span-2"><Skeleton className="h-4 w-16" /></div>
          <div className="col-span-2"><Skeleton className="h-4 w-10" /></div>
          <div className="col-span-2 flex justify-end"><Skeleton className="h-7 w-24" /></div>
        </div>
      ))}
    </div>
  );
}

// ── Wallet analysis ───────────────────────────────────────────────────────────

interface TokenBalance {
  symbol: string;
  name: string;
  chainName: string;
  amountUsd: number;
  amount: string;
}

const STORAGE_KEY = (address: string) => `eurooo_wallet_analysis_${address.toLowerCase()}`;

// ── Spinning star animation ───────────────────────────────────────────────────

function AnalysisSpinner() {
  const stars = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="relative w-24 h-24 mx-auto">
      <style>{`
        @keyframes ea-spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes ea-counter { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(-360deg); } }
        @keyframes ea-twinkle { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>
      <div className="absolute top-1/2 left-1/2 w-20 h-20"
        style={{ animation: 'ea-spin 2s linear infinite' }}>
        {stars.map(i => {
          const angle = i * 30 * (Math.PI / 180);
          const r = 42;
          const x = 50 + r * Math.cos(angle - Math.PI / 2);
          const y = 50 + r * Math.sin(angle - Math.PI / 2);
          return (
            <div key={i} className="absolute w-2.5 h-2.5"
              style={{
                left: `${x}%`, top: `${y}%`,
                transform: 'translate(-50%,-50%)',
                animation: `ea-counter 2s linear infinite, ea-twinkle ${1 + i % 3 * 0.4}s ease-in-out infinite`,
                animationDelay: `0s, ${i * 0.1}s`,
              }}>
              <svg viewBox="0 0 24 24" fill="hsl(var(--accent))" className="w-full h-full drop-shadow-[0_0_6px_hsl(var(--accent)/0.6)]">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function YieldSparkline({ principal, apy }: { principal: number; apy: number }) {
  const points = Array.from({ length: 13 }, (_, i) =>
    principal * Math.pow(1 + apy / 100 / 12, i)
  );
  const min = points[0]; const max = points[12]; const range = max - min || 1;
  const W = 280; const H = 56;
  const coords = points.map((v, i) => {
    const x = (i / 12) * W;
    const y = H - ((v - min) / range) * H * 0.85 - H * 0.075;
    return `${x},${y}`;
  });
  const pl = coords.join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="yg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pl} ${W},${H}`} fill="url(#yg)" />
      <polyline points={pl} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Yield Calculator ─────────────────────────────────────────────────────────

interface YieldCalculatorProps {
  bestApy: number;
}

type AnalysisState = 'idle' | 'loading' | 'done';

function YieldCalculator({ bestApy }: YieldCalculatorProps) {
  const { address, isConnected } = useAccount();
  const { data: rateData } = useEurUsdRate();
  const eurRate = rateData?.current ?? 0.92;

  // Live wallet data from wagmi hooks
  const walletAssets = useWalletAssets();

  // Build token list from wagmi data
  const liveTokens = useMemo((): TokenBalance[] => {
    const list: TokenBalance[] = [];
    if (walletAssets.ethBalanceRaw > 0.0001) {
      // Distribute ETH across chains — report as single aggregate for simplicity
      list.push({
        symbol: 'ETH',
        name: 'Ethereum',
        chainName: 'All chains',
        amountUsd: walletAssets.ethBalanceUsd,
        amount: walletAssets.ethBalanceRaw.toLocaleString('en-US', { maximumFractionDigits: 4 }),
      });
    }
    if (walletAssets.usdBalance > 0.01) {
      list.push({
        symbol: 'USD Stablecoins',
        name: 'USDC / USDT / DAI',
        chainName: 'All chains',
        amountUsd: walletAssets.usdBalance,
        amount: walletAssets.usdBalance.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      });
    }
    return list.sort((a, b) => b.amountUsd - a.amountUsd);
  }, [walletAssets.ethBalanceUsd, walletAssets.ethBalanceRaw, walletAssets.usdBalance]);

  // Persisted state — load from localStorage on mount
  const [tokens, setTokens] = useState<TokenBalance[]>(() => {
    if (typeof window === 'undefined' || !address) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(address));
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [analysisState, setAnalysisState] = useState<AnalysisState>(() =>
    tokens.length > 0 ? 'done' : 'idle'
  );

  // Re-load from storage when address changes
  useEffect(() => {
    if (!address) { setTokens([]); setAnalysisState('idle'); return; }
    try {
      const stored = localStorage.getItem(STORAGE_KEY(address));
      if (stored) { setTokens(JSON.parse(stored)); setAnalysisState('done'); }
      else { setTokens([]); setAnalysisState('idle'); }
    } catch { setTokens([]); setAnalysisState('idle'); }
  }, [address]);

  async function analyse() {
    if (!address) return;
    setAnalysisState('loading');
    // Show animation for at least 1.5s so it feels like something is happening
    await new Promise(r => setTimeout(r, 1500));
    const result = liveTokens.length > 0 ? liveTokens : [
      { symbol: 'USD Stablecoins', name: 'USDC/USDT/DAI', chainName: 'All chains', amountUsd: 0, amount: '0' },
    ];
    setTokens(result);
    localStorage.setItem(STORAGE_KEY(address), JSON.stringify(result));
    setAnalysisState('done');
  }

  const totalUsd = tokens.reduce((s, t) => s + t.amountUsd, 0);
  const totalEur = totalUsd * eurRate;

  const [manualAmount, setManualAmount] = useState<number | null>(null);
  const principal = manualAmount ?? (totalEur > 1 ? Math.round(totalEur) : 1000);
  const apy = bestApy > 0 ? bestApy : 4;
  const weekly  = (principal * (apy / 100)) / 52;
  const monthly = (principal * (apy / 100)) / 12;
  const yearly  = principal * (apy / 100);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 md:p-6">

      {/* ── Analyse CTA (idle) ── */}
      {analysisState === 'idle' && isConnected && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 pb-5 border-b border-border/40">
          <div>
            <p className="font-semibold text-sm">What are your funds worth in EUR yield?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We scan your wallet across all chains to calculate your potential earnings.
            </p>
          </div>
          <Button
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={analyse}
          >
            <TrendingUp className="h-4 w-4" />
            Analyse my wallet
          </Button>
        </div>
      )}

      {/* ── Loading animation ── */}
      {analysisState === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-6 mb-5 border-b border-border/40">
          <AnalysisSpinner />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Analysing your wallet…</p>
        </div>
      )}

      {/* ── Token results ── */}
      {analysisState === 'done' && tokens.length > 0 && (
        <div className="mb-5 pb-5 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your wallet</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold">
                ~€{totalEur.toLocaleString('en-US', { maximumFractionDigits: 0 })} total
              </span>
              <button
                onClick={() => { setAnalysisState('idle'); setTokens([]); if (address) localStorage.removeItem(STORAGE_KEY(address)); }}
                className="text-[10px] text-muted-foreground hover:text-foreground underline"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tokens.slice(0, 8).map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{t.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">{t.chainName}</p>
                </div>
                <p className="text-xs font-bold text-right shrink-0">
                  ${t.amountUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            ))}
            {tokens.length > 8 && (
              <div className="flex items-center justify-center rounded-lg bg-secondary/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">+{tokens.length - 8} more</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Calculator ── */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            What could this earn in EUR?
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
              <input
                type="number" min={100} step={100} value={principal}
                onChange={(e) => setManualAmount(Number(e.target.value) || 100)}
                className="w-full rounded-lg border border-input bg-background pl-7 pr-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">at</span>
            <span className="text-sm font-bold text-emerald-500 shrink-0">{apy.toFixed(2)}% APY</span>
            {analysisState === 'done' && totalEur > 1 && manualAmount === null && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Wallet className="h-3 w-3 mr-1" />Your wallet
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary/40 px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Weekly</p>
              <p className="text-base font-bold text-emerald-500">+€{weekly.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Monthly</p>
              <p className="text-base font-bold text-emerald-500">+€{monthly.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Yearly</p>
              <p className="text-base font-bold text-emerald-500">+€{yearly.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="md:w-72">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">12-month growth</p>
          <YieldSparkline principal={principal} apy={apy} />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Now</span>
            <span className="text-emerald-500 font-semibold">€{(principal + yearly).toLocaleString('en-US', { maximumFractionDigits: 0 })} in 12 months</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Pick a pool below and convert your funds to EUR — we handle the rest.
      </p>
    </div>
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
  const [depositVault, setDepositVault] = useState<UnifiedVault | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showOtherProtocols, setShowOtherProtocols] = useState(false);

  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const depositMap = buildDepositMap(protocols);

  // Group vaults by protocol, sorted by best APY
  const groups = useMemo<ProtocolGroup[]>(() => {
    const map = new Map<string, ProtocolGroup>();
    for (const v of vaults) {
      const existing = map.get(v.protocolKey);
      if (existing) {
        existing.vaults.push(v);
        existing.bestApy = Math.max(existing.bestApy, v.apy);
        existing.totalTvl += v.tvl;
      } else {
        map.set(v.protocolKey, {
          protocolKey: v.protocolKey,
          protocol: v.protocol,
          bestApy: v.apy,
          totalTvl: v.tvl,
          userDeposit: depositMap[v.protocolKey] ?? 0,
          vaults: [v],
        });
      }
    }
    return Array.from(map.values())
      .map(g => ({ ...g, userDeposit: depositMap[g.protocolKey] ?? 0 }))
      .sort((a, b) => {
        // LI.FI transactional protocols first, then by APY
        const aLifi = a.vaults.some(v => v.source === 'lifi' && v.isTransactional) ? 1 : 0;
        const bLifi = b.vaults.some(v => v.source === 'lifi' && v.isTransactional) ? 1 : 0;
        if (bLifi !== aLifi) return bLifi - aLifi;
        return b.bestApy - a.bestApy;
      });
  }, [vaults, depositMap]);

  const lifiGroups = groups.filter(g => g.vaults.some(v => v.source === 'lifi' && v.isTransactional));
  const otherGroups = groups.filter(g => !g.vaults.some(v => v.source === 'lifi' && v.isTransactional));

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

      {/* Vault Table */}
      {error ? (
        <div className="text-center py-20 text-muted-foreground">Failed to load vaults. Please try again.</div>
      ) : isLoading ? (
        <VaultTableSkeleton />
      ) : groups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No vaults found.</div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-secondary/30 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-4">Protocol</div>
            <div className="col-span-2">Best APY</div>
            <div className="col-span-2">TVL</div>
            <div className="col-span-2">Your Balance</div>
            <div className="col-span-2 text-right">Action</div>
          </div>
          {/* LI.FI one-click rows */}
          <div className="divide-y divide-border/30">
            {lifiGroups.map((group) => (
              <ProtocolGroupRow
                key={group.protocolKey}
                group={group}
                depositMap={depositMap}
                isExpanded={expandedGroups.has(group.protocolKey)}
                onToggle={() => toggleGroup(group.protocolKey)}
                onDeposit={(v) => setDepositVault(v)}
              />
            ))}
          </div>
          {/* Other protocols — collapsed by default */}
          {otherGroups.length > 0 && (
            <>
              <button
                onClick={() => setShowOtherProtocols(p => !p)}
                className="w-full flex items-center justify-between gap-2 px-6 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors border-t border-border/30"
              >
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {showOtherProtocols
                    ? 'Hide other protocols'
                    : `Show ${otherGroups.length} more protocol${otherGroups.length > 1 ? 's' : ''} (manual deposit only)`}
                </span>
                {showOtherProtocols
                  ? <ChevronDown className="h-3.5 w-3.5" />
                  : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              {showOtherProtocols && (
                <div className="divide-y divide-border/30 border-t border-border/30 bg-secondary/10">
                  {otherGroups.map((group) => (
                    <ProtocolGroupRow
                      key={group.protocolKey}
                      group={group}
                      depositMap={depositMap}
                      isExpanded={expandedGroups.has(group.protocolKey)}
                      onToggle={() => toggleGroup(group.protocolKey)}
                      onDeposit={(v) => setDepositVault(v)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Yield Calculator */}
      <YieldCalculator bestApy={vaults[0]?.apy ?? 0} />

      {/* Legend */}
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span>1-click deposit powered by LI.FI · Other protocols open directly on their platform</span>
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
          path="/earn"
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
