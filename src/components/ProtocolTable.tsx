import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp, ChevronDown, ChevronRight, TrendingUp, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProtocolData } from '@/hooks/useProtocolData';
import { SafetyScoreBadge } from '@/components/SafetyScoreBadge';

import aaveLogo from '@/assets/aave-logo.png';
import summerLogo from '@/assets/summer-logo.png';
import yoLogo from '@/assets/yo-logo.png';
import morphoLogo from '@/assets/morpho-logo.svg';

interface ProtocolTableProps {
  protocols: ProtocolData[];
  onDeposit: (protocol: ProtocolData) => void;
  onWithdraw: (protocol: ProtocolData) => void;
}

type SortKey = 'apy' | 'tvl' | 'userDeposit';
type SortDirection = 'asc' | 'desc';

const protocolLogos: Record<string, string> = {
  'aave': aaveLogo,
  'aave-ethereum': aaveLogo,
  'aave-base': aaveLogo,
  'aave-gnosis': aaveLogo,
  'morpho': morphoLogo,
  'morpho-gauntlet': morphoLogo,
  'morpho-prime': morphoLogo,
  'morpho-kpk': morphoLogo,
  summer: summerLogo,
  yo: yoLogo,
  fluid: summerLogo, // Using summer logo as placeholder - can be replaced with Fluid logo later
};

const colorClasses = {
  aave: 'bg-aave/10 border-aave/30',
  summer: 'bg-summer/10 border-summer/30',
  yo: 'bg-yo/10 border-yo/30',
  morpho: 'bg-morpho/10 border-morpho/30',
  fluid: 'bg-fluid/10 border-fluid/30',
};

export function ProtocolTable({ protocols, onDeposit, onWithdraw }: ProtocolTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Check if user has any deposits (including sub-protocols)
  const hasAnyDeposits = protocols.some(p => 
    p.userDeposit > 0 || (p.subProtocols?.some(sp => sp.userDeposit > 0))
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const toggleGroup = (protocolId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(protocolId)) {
        next.delete(protocolId);
      } else {
        next.add(protocolId);
      }
      return next;
    });
  };

  const sortedProtocols = [...protocols].sort((a, b) => {
    // If user has manually selected a sort, use that
    if (sortKey !== null) {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const multiplier = sortDirection === 'desc' ? -1 : 1;
      return (aValue - bValue) * multiplier;
    }
    
    // Default sorting: if deposits exist, sort by deposit (highest first)
    // Otherwise, sort by TVL (highest first)
    if (hasAnyDeposits) {
      return b.userDeposit - a.userDeposit;
    }
    return b.tvl - a.tvl;
  });

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortDirection === 'desc' ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronUp className="h-4 w-4" />
    );
  };

  // Calculate totals for footer (including sub-protocols)
  const totalDeposits = protocols.reduce((sum, p) => {
    if (p.isGrouped && p.subProtocols) {
      return sum + p.subProtocols.reduce((s, sp) => s + sp.userDeposit, 0);
    }
    return sum + p.userDeposit;
  }, 0);
  
  const weightedApy = totalDeposits > 0
    ? protocols.reduce((sum, p) => {
        if (p.isGrouped && p.subProtocols) {
          return sum + p.subProtocols.reduce((s, sp) => s + (sp.apy * sp.userDeposit), 0);
        }
        return sum + (p.apy * p.userDeposit);
      }, 0) / totalDeposits
    : 0;
  const dailyYield = (totalDeposits * (weightedApy / 100)) / 365;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Desktop Table Header - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/30 border-b border-border/50 text-sm font-medium text-muted-foreground">
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
        <div className="col-span-1">Safety</div>
        <button 
          className="col-span-2 flex items-center gap-1 hover:text-foreground transition-colors text-left"
          onClick={() => handleSort('userDeposit')}
        >
          Your Deposit <SortIcon columnKey="userDeposit" />
        </button>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/30">
        {sortedProtocols.map((protocol) => (
          <ProtocolRow 
            key={protocol.id}
            protocol={protocol}
            onDeposit={onDeposit}
            onWithdraw={onWithdraw}
            isExpanded={expandedGroups.has(protocol.id)}
            onToggleExpand={() => toggleGroup(protocol.id)}
          />
        ))}
      </div>

      {/* Desktop Table Footer - Summary (Hidden on mobile) */}
      {totalDeposits > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-success/5 border-t border-success/20 text-sm font-medium">
          <div className="col-span-3 text-muted-foreground">Total Portfolio</div>
          <div className="col-span-1">—</div>
          <div className="col-span-2 text-success">{weightedApy.toFixed(2)}% avg</div>
          <div className="col-span-2">—</div>
          <div className="col-span-2 font-bold">
            €{totalDeposits.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
          <div className="col-span-2 text-right text-success">
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isSubRow?: boolean;
}

function ProtocolRow({ protocol, onDeposit, onWithdraw, isExpanded, onToggleExpand, isSubRow }: ProtocolRowProps) {
  const hasDeposit = protocol.userDeposit > 0;
  const hasData = protocol.apy > 0 || protocol.tvl > 0;
  const dailyYield = (protocol.userDeposit * (protocol.apy / 100)) / 365;
  const isGrouped = protocol.isGrouped && protocol.subProtocols;

  const logoSrc = protocol.logo || protocolLogos[protocol.id];

  return (
    <>
      {/* Mobile Card Layout */}
      <div 
        className={cn(
          "md:hidden p-4 space-y-3",
          hasDeposit && !isSubRow && "bg-success/5 border-l-2 border-l-success",
          isSubRow && "pl-8 bg-secondary/10"
        )}
      >
        {/* Row 1: Protocol Info + APY */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Expand toggle for grouped protocols */}
            {isGrouped && (
              <button 
                onClick={onToggleExpand}
                className="p-1 -ml-2 hover:bg-secondary/50 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border overflow-hidden flex-shrink-0",
              colorClasses[protocol.color]
            )}>
              <img 
                src={logoSrc} 
                alt={`${protocol.name} logo`}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                {isSubRow && <span className="text-muted-foreground">└─</span>}
                <span className="font-semibold text-sm">{protocol.name}</span>
                {protocol.learnMoreUrl && (
                  <a
                    href={protocol.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Learn more"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary">
                  {protocol.stablecoin}
                </Badge>
                {isGrouped ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {protocol.chains.length} chains
                  </Badge>
                ) : (
                  protocol.chains.map((chain) => (
                    <Badge key={chain} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {chain}
                    </Badge>
                  ))
                )}
                {(protocol.safetyScore !== undefined || protocol.auditUrl) && !isSubRow && (
                  <SafetyScoreBadge 
                    score={protocol.safetyScore} 
                    provider={protocol.safetyProvider}
                    reportUrl={protocol.safetyReportUrl}
                    auditUrl={protocol.auditUrl}
                    auditProvider={protocol.auditProvider}
                    compact
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* APY on right side */}
          <div className="text-right">
            {protocol.isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : hasData ? (
              <div className="flex items-center gap-1 justify-end">
                <span className="text-xl font-bold text-success">{protocol.apy.toFixed(2)}%</span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Row 2: User Deposit Info (if deposited) */}
        {hasDeposit && !protocol.isLoading && (
          <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2">
            <div>
              <span className="text-xs text-muted-foreground">Your Deposit</span>
              <div className="font-bold">
                €{protocol.userDeposit.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Daily Yield</span>
              <div className="text-success font-medium">
                +€{dailyYield.toFixed(4)}/day
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Action Buttons - Only show for non-grouped or sub-rows */}
        {(!isGrouped || isSubRow) && (
          <div className="flex gap-2">
            <Button 
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onDeposit(protocol)}
              disabled={!hasData}
            >
              Deposit
            </Button>
            {hasDeposit && (
              <Button 
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onWithdraw(protocol)}
              >
                Withdraw
              </Button>
            )}
          </div>
        )}

        {/* Expand button for grouped protocols */}
        {isGrouped && !isSubRow && (
          <Button 
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onToggleExpand}
          >
            {isExpanded ? 'Hide chains' : `Show ${protocol.subProtocols?.length} chains`}
          </Button>
        )}
      </div>

      {/* Mobile: Sub-rows when expanded */}
      {isGrouped && isExpanded && (
        <div className="md:hidden">
          {protocol.subProtocols?.map((sub) => (
            <ProtocolRow
              key={sub.id}
              protocol={sub}
              onDeposit={onDeposit}
              onWithdraw={onWithdraw}
              isSubRow
            />
          ))}
        </div>
      )}

      {/* Desktop Table Row - Hidden on mobile */}
      <div 
        className={cn(
          "hidden md:grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-secondary/20",
          hasDeposit && !isSubRow && "bg-success/5 border-l-2 border-l-success",
          isSubRow && "bg-secondary/10 pl-10"
        )}
      >
        {/* Protocol Info */}
        <div className="col-span-3 flex items-center gap-3">
          {/* Expand toggle for grouped protocols */}
          {isGrouped && (
            <button 
              onClick={onToggleExpand}
              className="p-1 -ml-2 hover:bg-secondary/50 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          {isSubRow && <span className="text-muted-foreground -ml-2">└─</span>}
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border overflow-hidden",
            colorClasses[protocol.color]
          )}>
            <img 
              src={logoSrc} 
              alt={`${protocol.name} logo`}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{protocol.name}</span>
              {protocol.learnMoreUrl && (
                <a
                  href={protocol.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Learn more"
                >
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary">
                {protocol.stablecoin}
              </Badge>
              {isGrouped ? (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {protocol.chains.length} chains
                </Badge>
              ) : (
                protocol.chains.map((chain) => (
                  <Badge key={chain} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {chain}
                  </Badge>
                ))
              )}
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

        {/* Safety Score */}
        <div className="col-span-1">
          {!isSubRow && (
            <SafetyScoreBadge 
              score={protocol.safetyScore} 
              provider={protocol.safetyProvider}
              reportUrl={protocol.safetyReportUrl}
              auditUrl={protocol.auditUrl}
              auditProvider={protocol.auditProvider}
            />
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
        <div className="col-span-2 flex justify-end gap-2">
          {/* For grouped rows, show expand button instead of direct deposit */}
          {isGrouped ? (
            <Button 
              size="sm"
              variant="outline"
              onClick={onToggleExpand}
            >
              {isExpanded ? 'Hide' : 'Expand'}
            </Button>
          ) : (
            <>
              <Button 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                onClick={() => onDeposit(protocol)}
                disabled={!hasData}
              >
                Deposit
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
            </>
          )}
        </div>
      </div>

      {/* Desktop: Sub-rows when expanded */}
      {isGrouped && isExpanded && (
        <div className="hidden md:block">
          {protocol.subProtocols?.map((sub) => (
            <ProtocolRow
              key={sub.id}
              protocol={sub}
              onDeposit={onDeposit}
              onWithdraw={onWithdraw}
              isSubRow
            />
          ))}
        </div>
      )}
    </>
  );
}
