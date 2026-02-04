import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ChainSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const chains = [
  { id: 'all', name: 'All Chains' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'base', name: 'Base' },
  { id: 'gnosis', name: 'Gnosis' },
  { id: 'avalanche', name: 'Avalanche' },
  { id: 'arbitrum', name: 'Arbitrum' },
];

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-[160px]">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain) => (
          <SelectItem key={chain.id} value={chain.id}>
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
