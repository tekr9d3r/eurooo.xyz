import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ProtocolCard } from './ProtocolCard';
import { YieldCounter } from './YieldCounter';
import { ChainSelector } from './ChainSelector';
import { DepositModal } from './DepositModal';
import { useToast } from '@/hooks/use-toast';
import { useProtocolData, ProtocolData } from '@/hooks/useProtocolData';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolData | null>(null);
  
  const { protocols, totalDeposits, averageApy, eurcBalance, isLoading } = useProtocolData();

  const filteredProtocols = selectedChain === 'all'
    ? protocols
    : protocols.filter((p) => 
        p.chains.some((c) => c.toLowerCase() === selectedChain.toLowerCase())
      );

  const handleDeposit = (protocol: ProtocolData) => {
    setSelectedProtocol(protocol);
    setDepositModalOpen(true);
  };

  const handleWithdraw = (protocol: ProtocolData) => {
    toast({
      title: 'Withdraw initiated',
      description: `Withdrawing from ${protocol.name}...`,
    });
  };

  const handleDepositConfirm = (amount: number) => {
    if (selectedProtocol) {
      toast({
        title: 'Deposit transaction',
        description: `Please confirm the transaction in your wallet to deposit €${amount} into ${selectedProtocol.name}`,
      });
    }
    setDepositModalOpen(false);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container">
        {/* Wallet Balance Banner */}
        <div className="mb-8 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Your EURC Wallet Balance</p>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <span className="text-2xl font-bold">
                  €{eurcBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Available to deposit</p>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span className="text-lg font-semibold text-success">
                  €{eurcBalance.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Yield Counter - Sidebar */}
          <div className="lg:col-span-1">
            <YieldCounter totalDeposit={totalDeposits} averageApy={averageApy} isLoading={isLoading} />
          </div>

          {/* Protocol Cards */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Yield Opportunities</h2>
              <ChainSelector value={selectedChain} onChange={setSelectedChain} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {filteredProtocols.map((protocol) => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        protocol={selectedProtocol}
        onConfirm={handleDepositConfirm}
        maxAmount={eurcBalance}
      />
    </section>
  );
}
