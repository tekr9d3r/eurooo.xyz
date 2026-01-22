import { useEffect, useState, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { formatUnits, parseAbiItem, Address } from 'viem';
import { usePublicClient } from 'wagmi';
import {
  AAVE_V3_POOL_ADDRESSES,
  EURC_ADDRESSES,
} from '@/lib/contracts';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  protocol: string;
  timestamp: Date;
  txHash: string;
  chainId: number;
}

const BLOCK_EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
};

// Aave Pool events
const SUPPLY_EVENT = parseAbiItem('event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)');
const WITHDRAW_EVENT = parseAbiItem('event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)');

// How many blocks to look back (approx 7 days on Base at 2s blocks)
const BLOCKS_TO_SEARCH = 300000n;

export function useTransactionHistory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const poolAddress = AAVE_V3_POOL_ADDRESSES[chainId as keyof typeof AAVE_V3_POOL_ADDRESSES];
  const eurcAddress = EURC_ADDRESSES[chainId as keyof typeof EURC_ADDRESSES];
  const blockExplorer = BLOCK_EXPLORERS[chainId] || 'https://etherscan.io';

  const fetchTransactions = useCallback(async () => {
    if (!address || !publicClient || !poolAddress || !eurcAddress) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BLOCKS_TO_SEARCH ? currentBlock - BLOCKS_TO_SEARCH : 0n;

      // Fetch Supply events (deposits)
      const supplyLogs = await publicClient.getLogs({
        address: poolAddress,
        event: SUPPLY_EVENT,
        args: {
          reserve: eurcAddress,
          onBehalfOf: address,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      // Fetch Withdraw events
      const withdrawLogs = await publicClient.getLogs({
        address: poolAddress,
        event: WITHDRAW_EVENT,
        args: {
          reserve: eurcAddress,
          user: address,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      // Get block timestamps
      const allLogs = [...supplyLogs, ...withdrawLogs];
      const blockNumbers = [...new Set(allLogs.map(log => log.blockNumber))];
      
      const blockTimestamps: Record<string, bigint> = {};
      await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          if (blockNumber) {
            const block = await publicClient.getBlock({ blockNumber });
            blockTimestamps[blockNumber.toString()] = block.timestamp;
          }
        })
      );

      // Process supply events
      const depositTxs: Transaction[] = supplyLogs.map((log) => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        type: 'deposit' as const,
        amount: Number(formatUnits(log.args.amount || 0n, 6)),
        protocol: 'Aave',
        timestamp: new Date(Number(blockTimestamps[log.blockNumber?.toString() || '0'] || 0n) * 1000),
        txHash: log.transactionHash,
        chainId,
      }));

      // Process withdraw events
      const withdrawTxs: Transaction[] = withdrawLogs.map((log) => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        type: 'withdraw' as const,
        amount: Number(formatUnits(log.args.amount || 0n, 6)),
        protocol: 'Aave',
        timestamp: new Date(Number(blockTimestamps[log.blockNumber?.toString() || '0'] || 0n) * 1000),
        txHash: log.transactionHash,
        chainId,
      }));

      // Combine and sort by timestamp (newest first)
      const allTransactions = [...depositTxs, ...withdrawTxs].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setTransactions(allTransactions);
    } catch (e) {
      console.error('Error fetching transaction history:', e);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, publicClient, poolAddress, eurcAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    blockExplorer,
  };
}
