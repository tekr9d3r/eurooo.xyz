import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { PortfolioHeader } from './PortfolioHeader';
import { ProtocolTable } from './ProtocolTable';
import { ChainSelector } from './ChainSelector';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { toast } from 'sonner';
import { useProtocolData, ProtocolData } from '@/hooks/useProtocolData';
import { MessageCircle, ArrowRight } from 'lucide-react';

export function Dashboard() {
  const { isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolData | null>(null);
  
  const { protocols, totalDeposits, averageApy, eurcBalance, isLoading, refetch } = useProtocolData();

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
    setSelectedProtocol(protocol);
    setWithdrawModalOpen(true);
  };

  const handleDepositConfirm = useCallback(() => {
    toast.success('Deposit successful');
    refetch();
  }, [refetch]);

  const handleWithdrawComplete = useCallback(() => {
    toast.success('Withdrawal successful');
    refetch();
  }, [refetch]);

  return (
    <section className="py-12">
      <div className="container">
        {/* Portfolio Summary Header */}
        <PortfolioHeader
          totalDeposits={totalDeposits}
          averageApy={averageApy}
          isLoading={isLoading}
        />

        {/* Protocol Table Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Yield Opportunities</h2>
            <ChainSelector value={selectedChain} onChange={setSelectedChain} />
          </div>

          {/* Swap CTA Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-5 sm:p-6">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold">Don't have EUR stablecoins?</h3>
                <p className="text-sm text-muted-foreground mt-1">Swap any crypto to EURC instantly — best rates aggregated for you.</p>
              </div>
              <a
                href="https://www.swap.eurooo.xyz/"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Swap to EUR
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <ProtocolTable
            protocols={filteredProtocols}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />

          {/* Telegram CTA */}
          <div className="flex items-center justify-center gap-3 rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Need help or have questions about protocols?{' '}
              <a
                href="https://t.me/+wxIKk-lsEy5kMGQ0"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Join our Telegram community
              </a>
            </p>
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

      <WithdrawModal
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        protocol={selectedProtocol}
        onComplete={handleWithdrawComplete}
      />
    </section>
  );
}
