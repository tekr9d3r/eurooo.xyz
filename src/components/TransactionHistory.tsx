import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactionHistory, Transaction } from '@/hooks/useTransactionHistory';
import { formatDistanceToNow } from 'date-fns';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
};

function TransactionRow({ tx, blockExplorer }: { tx: Transaction; blockExplorer: string }) {
  const isDeposit = tx.type === 'deposit';
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isDeposit ? 'bg-success/10' : 'bg-muted'}`}>
          {isDeposit ? (
            <ArrowDownLeft className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {isDeposit ? 'Deposited' : 'Withdrew'} to {tx.protocol}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(tx.timestamp, { addSuffix: true })} • {CHAIN_NAMES[tx.chainId] || 'Unknown'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${isDeposit ? 'text-success' : ''}`}>
          {isDeposit ? '+' : '-'}€{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
        </span>
        <a
          href={`${blockExplorer}/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function TransactionHistory() {
  const { transactions, isLoading, error, refetch, blockExplorer } = useTransactionHistory();

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && transactions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="link" size="sm" onClick={refetch} className="mt-2">
              Try again
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your deposits and withdrawals will appear here
            </p>
          </div>
        ) : (
          <div>
            {transactions.slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} blockExplorer={blockExplorer} />
            ))}
            {transactions.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-3">
                Showing 5 of {transactions.length} transactions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
