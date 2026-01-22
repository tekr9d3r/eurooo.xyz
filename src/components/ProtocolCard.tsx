import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtocolData } from '@/hooks/useProtocolData';

import aaveLogo from '@/assets/aave-logo.png';
import summerLogo from '@/assets/summer-logo.svg';
import yoLogo from '@/assets/yo-logo.svg';

interface ProtocolCardProps {
  protocol: ProtocolData;
  onDeposit: (protocol: ProtocolData) => void;
  onWithdraw: (protocol: ProtocolData) => void;
}

const protocolLogos: Record<string, string> = {
  aave: aaveLogo,
  summer: summerLogo,
  yo: yoLogo,
};

const colorClasses = {
  aave: 'bg-aave/10 text-aave border-aave/20',
  summer: 'bg-summer/10 text-summer border-summer/20',
  yo: 'bg-yo/10 text-yo border-yo/20',
};

const dotClasses = {
  aave: 'bg-aave',
  summer: 'bg-summer',
  yo: 'bg-yo',
};

export function ProtocolCard({ protocol, onDeposit, onWithdraw }: ProtocolCardProps) {
  const hasDeposit = protocol.userDeposit && protocol.userDeposit > 0;
  const hasData = protocol.apy > 0 || protocol.tvl > 0;
  const isAvailable = protocol.isSupported && hasData;

  return (
    <Card className="card-hover border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border overflow-hidden', colorClasses[protocol.color])}>
              <img 
                src={protocolLogos[protocol.id]} 
                alt={`${protocol.name} logo`}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold">{protocol.name}</h3>
              <p className="text-sm text-muted-foreground">{protocol.description}</p>
            </div>
          </div>
          <a
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Learn more"
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* APY Display */}
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Current APY</p>
            {protocol.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : hasData ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-success">{protocol.apy.toFixed(2)}%</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            ) : (
              <span className="text-lg text-muted-foreground">Coming soon</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Deposited</p>
            {protocol.isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="text-lg font-semibold">{protocol.tvlFormatted}</span>
            )}
          </div>
        </div>

        {/* User deposit */}
        {hasDeposit && (
          <div className="rounded-lg border border-success/20 bg-success/5 p-4">
            <p className="text-sm text-muted-foreground">Your deposit</p>
            <span className="text-xl font-bold">
              €{protocol.userDeposit.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Supported chains */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Available on:</span>
          <div className="flex gap-1">
            {protocol.chains.map((chain) => (
              <Badge key={chain} variant="secondary" className="text-xs">
                {chain}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={() => onDeposit(protocol)}
          disabled={!isAvailable}
        >
          {!protocol.isSupported ? 'Switch to Base' : isAvailable ? 'Deposit' : 'Coming Soon'}
        </Button>
        {hasDeposit && (
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onWithdraw(protocol)}
          >
            Withdraw
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Re-export type for backward compatibility
export type Protocol = ProtocolData;
