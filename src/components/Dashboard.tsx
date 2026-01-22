import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ProtocolCard, Protocol } from './ProtocolCard';
import { YieldCounter } from './YieldCounter';
import { ChainSelector } from './ChainSelector';
import { DepositModal } from './DepositModal';
import { useToast } from '@/hooks/use-toast';

// Mock protocol data - in production, this would come from smart contract reads
const protocols: Protocol[] = [
  {
    id: 'aave',
    name: 'Aave',
    description: 'Leading lending protocol',
    apy: 5.24,
    tvl: '€12.4M',
    chains: ['Ethereum', 'Base'],
    color: 'aave',
    userDeposit: 0,
  },
  {
    id: 'summer',
    name: 'Summer.fi',
    description: 'DeFi management platform',
    apy: 6.12,
    tvl: '€8.7M',
    chains: ['Ethereum'],
    color: 'summer',
    userDeposit: 0,
  },
  {
    id: 'yo',
    name: 'Yo.xyz',
    description: 'Yield optimizer for staking',
    apy: 8.45,
    tvl: '€3.2M',
    chains: ['Ethereum', 'Base'],
    color: 'yo',
    userDeposit: 0,
  },
];

export function Dashboard() {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  
  // Mock user deposits - in production would come from contract reads
  const [userDeposits, setUserDeposits] = useState<Record<string, number>>({
    aave: 1000,
    summer: 500,
    yo: 250,
  });

  const protocolsWithDeposits = protocols.map((p) => ({
    ...p,
    userDeposit: userDeposits[p.id] || 0,
  }));

  const filteredProtocols = selectedChain === 'all'
    ? protocolsWithDeposits
    : protocolsWithDeposits.filter((p) => 
        p.chains.some((c) => c.toLowerCase() === selectedChain.toLowerCase())
      );

  const totalDeposit = Object.values(userDeposits).reduce((a, b) => a + b, 0);
  const averageApy = protocolsWithDeposits.reduce((sum, p) => {
    const deposit = userDeposits[p.id] || 0;
    return sum + (p.apy * deposit);
  }, 0) / (totalDeposit || 1);

  const handleDeposit = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setDepositModalOpen(true);
  };

  const handleWithdraw = (protocol: Protocol) => {
    toast({
      title: 'Withdraw initiated',
      description: `Withdrawing from ${protocol.name}...`,
    });
  };

  const handleDepositConfirm = (amount: number) => {
    if (selectedProtocol) {
      setUserDeposits((prev) => ({
        ...prev,
        [selectedProtocol.id]: (prev[selectedProtocol.id] || 0) + amount,
      }));
      toast({
        title: 'Deposit successful!',
        description: `Deposited €${amount} into ${selectedProtocol.name}`,
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
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Yield Counter - Sidebar */}
          <div className="lg:col-span-1">
            <YieldCounter totalDeposit={totalDeposit} averageApy={averageApy} />
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
      />
    </section>
  );
}
