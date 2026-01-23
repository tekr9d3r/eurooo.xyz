import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtocolData } from '@/hooks/useProtocolData';

import aaveLogo from '@/assets/aave-logo.png';
import summerLogo from '@/assets/summer-logo.png';
import yoLogo from '@/assets/yo-logo.png';
import morphoLogo from '@/assets/morpho-logo.png';

interface ProtocolTableProps {
  protocols: ProtocolData[];
  onDeposit: (protocol: ProtocolData) => void;
  onWithdraw: (protocol: ProtocolData) => void;
}

type SortKey = 'apy' | 'tvl' | 'userDeposit';
type SortDirection = 'asc' | 'desc';

const protocolLogos: Record<string, string> = {
  aave: aaveLogo,
  summer: summerLogo,
  yo: yoLogo,
  'morpho-gauntlet': morphoLogo,
  'morpho-prime': morphoLogo,
};

const colorClasses = {
  aave: 'bg-aave/10 border-aave/30',
  summer: 'bg-summer/10 border-summer/30',
  yo: 'bg-yo/10 border-yo/30',
  morpho: 'bg-blue-500/10 border-blue-500/30',
};

export function ProtocolTable({ protocols, onDeposit, onWithdraw }: ProtocolTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('apy');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedProtocols = [...protocols].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    const multiplier = sortDirection === 'desc' ? -1 : 1;
    return (aValue - bValue) * multiplier;
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === 'desc' ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronUp className="h-4 w-4" />
    );
  };

  // Calculate totals for footer
  const totalDeposits = protocols.reduce((sum, p) => sum + p.userDeposit, 0);
  const weightedApy = totalDeposits > 0
    ? protocols.reduce((sum, p) => sum + (p.apy * p.userDeposit), 0) / totalDeposits
    : 0;
  const dailyYield = (totalDeposits * (weightedApy / 100)) / 365;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/30 border-b border-border/50 text-sm font-medium text-muted-foreground">
        <div className="col-span-3">Protocol</div>
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('apy')}
        >
          APY <SortIcon columnKey="apy" />
        </button>
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('tvl')}
        >
          TVL <SortIcon columnKey="tvl" />
        </button>
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('userDeposit')}
        >
          Your Deposit <SortIcon columnKey="userDeposit" />
        </button>
        <div className="col-span-3 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/30">
        {sortedProtocols.map((protocol) => (
          <ProtocolRow 
            key={protocol.id}
            protocol={protocol}
            onDeposit={onDeposit}
            onWithdraw={onWithdraw}
          />
        ))}
      </div>

      {/* Table Footer - Summary */}
      {totalDeposits > 0 && (
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-success/5 border-t border-success/20 text-sm font-medium">
          <div className="col-span-3 text-muted-foreground">Total Portfolio</div>
          <div className="col-span-2 text-success">{weightedApy.toFixed(2)}% avg</div>
          <div className="col-span-2">—</div>
          <div className="col-span-2 font-bold">
            €{totalDeposits.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
          <div className="col-span-3 text-right text-success">
            +€{dailyYield.toFixed(4)}/day
          </div>
        </div>
      )}
    </div>
  );
}

interface ProtocolRowProps {
  protocol: ProtocolData;
  onDeposit: (protocol: ProtocolData) => void;
  onWithdraw: (protocol: ProtocolData) => void;
}

function ProtocolRow({ protocol, onDeposit, onWithdraw }: ProtocolRowProps) {
  const hasDeposit = protocol.userDeposit > 0;
  const hasData = protocol.apy > 0 || protocol.tvl > 0;
  const isAvailable = protocol.isSupported && hasData;
  const dailyYield = (protocol.userDeposit * (protocol.apy / 100)) / 365;

  return (
    <div 
      className={cn(
        "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-secondary/20",
        hasDeposit && "bg-success/5 border-l-2 border-l-success"
      )}
    >
      {/* Protocol Info */}
      <div className="col-span-3 flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border overflow-hidden",
          colorClasses[protocol.color]
        )}>
          <img 
            src={protocolLogos[protocol.id]} 
            alt={`${protocol.name} logo`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{protocol.name}</span>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Learn more"
            >
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-1 mt-1">
            {protocol.chains.map((chain) => (
              <Badge key={chain} variant="secondary" className="text-[10px] px-1.5 py-0">
                {chain}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* APY */}
      <div className="col-span-2">
        {protocol.isLoading ? (
          <Skeleton className="h-6 w-16" />
        ) : hasData ? (
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-success">{protocol.apy.toFixed(2)}%</span>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* TVL */}
      <div className="col-span-2">
        {protocol.isLoading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <span className="font-medium">{protocol.tvlFormatted}</span>
        )}
      </div>

      {/* User Deposit */}
      <div className="col-span-2">
        {protocol.isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : hasDeposit ? (
          <div>
            <div className="font-bold">
              €{protocol.userDeposit.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-success">
              +€{dailyYield.toFixed(4)}/day
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="col-span-3 flex justify-end gap-2">
        <Button 
          size="sm"
          className="bg-primary hover:bg-primary/90"
          onClick={() => onDeposit(protocol)}
          disabled={!isAvailable}
        >
          {!protocol.isSupported ? 'Switch Network' : isAvailable ? 'Deposit' : 'Coming Soon'}
        </Button>
        {hasDeposit && (
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onWithdraw(protocol)}
          >
            Withdraw
          </Button>
        )}
      </div>
    </div>
  );
}
