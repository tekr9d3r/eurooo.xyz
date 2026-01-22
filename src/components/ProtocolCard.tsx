import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Protocol {
  id: string;
  name: string;
  description: string;
  apy: number;
  tvl: string;
  chains: string[];
  color: 'aave' | 'summer' | 'yo';
  userDeposit?: number;
}

interface ProtocolCardProps {
  protocol: Protocol;
  onDeposit: (protocol: Protocol) => void;
  onWithdraw: (protocol: Protocol) => void;
}

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

  return (
    <Card className="card-hover border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', colorClasses[protocol.color])}>
              <span className="text-lg font-bold">{protocol.name.charAt(0)}</span>
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
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-success">{protocol.apy.toFixed(2)}%</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Deposited</p>
            <span className="text-lg font-semibold">{protocol.tvl}</span>
          </div>
        </div>

        {/* User deposit */}
        {hasDeposit && (
          <div className="rounded-lg border border-success/20 bg-success/5 p-4">
            <p className="text-sm text-muted-foreground">Your deposit</p>
            <span className="text-xl font-bold">€{protocol.userDeposit?.toLocaleString()}</span>
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
        >
          Deposit
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
