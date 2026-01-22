import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { PortfolioHeader } from './PortfolioHeader';
import { ProtocolTable } from './ProtocolTable';
import { ChainSelector } from './ChainSelector';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { useToast } from '@/hooks/use-toast';
import { useProtocolData, ProtocolData } from '@/hooks/useProtocolData';

export function Dashboard() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
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
    toast({
      title: 'Deposit successful',
      description: 'Your deposit has been confirmed.',
    });
    refetch();
  }, [toast, refetch]);

  const handleWithdrawComplete = useCallback(() => {
    toast({
      title: 'Withdrawal successful',
      description: 'Your withdrawal has been confirmed.',
    });
    refetch();
  }, [toast, refetch]);

  return (
    <section className="py-12">
      <div className="container">
        {/* Portfolio Summary Header */}
        <PortfolioHeader
          eurcBalance={eurcBalance}
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

          <ProtocolTable
            protocols={filteredProtocols}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
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
