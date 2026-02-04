import { useState, useEffect, useCallback } from 'react';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/roinevirta/euro-stablecoin-research/main';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface TokenData {
  ticker: string;
  issuer: string;
  supply: number;
  marketShare: number;
  stablecoinType: string;
  regulatoryFramework: string;
  status: string;
}

export interface IssuerData {
  issuer: string;
  ticker: string;
  headquarters: string;
  regulation: string;
  backing: string;
  status: string;
}

export interface BreakdownItem {
  name: string;
  value: number;
  percentage: number;
}

export interface StablecoinStats {
  totalSupply: number;
  topStablecoins: TokenData[];
  byBackingType: BreakdownItem[];
  byRegulatoryStatus: BreakdownItem[];
  byBlockchain: BreakdownItem[];
  issuers: IssuerData[];
  lastUpdated: Date | null;
}

interface CacheEntry {
  data: StablecoinStats;
  timestamp: number;
}

let cache: CacheEntry | null = null;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    // Handle quoted values with commas inside
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {} as Record<string, string>);
  });
}

function parseNumber(value: string): number {
  if (!value || value === '-' || value === 'NA' || value === 'N/A') return 0;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function useStablecoinStats() {
  const [data, setData] = useState<StablecoinStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    // Check cache
    if (!force && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      setData(cache.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [marketCapRes, tokenInfoRes, issuerRes] = await Promise.all([
        fetch(`${GITHUB_BASE_URL}/MarketCapitalisationData.csv`),
        fetch(`${GITHUB_BASE_URL}/TokenInformation.csv`),
        fetch(`${GITHUB_BASE_URL}/IssuerData.csv`),
      ]);

      if (!marketCapRes.ok || !tokenInfoRes.ok || !issuerRes.ok) {
        throw new Error('Failed to fetch data from GitHub');
      }

      const [marketCapText, tokenInfoText, issuerText] = await Promise.all([
        marketCapRes.text(),
        tokenInfoRes.text(),
        issuerRes.text(),
      ]);

      const marketCapData = parseCSV(marketCapText);
      const tokenInfoData = parseCSV(tokenInfoText);
      const issuerData = parseCSV(issuerText);

      // Create a map of token info for quick lookup
      const tokenInfoMap = new Map<string, Record<string, string>>();
      tokenInfoData.forEach(token => {
        const ticker = token.Ticker || token.ticker || '';
        if (ticker) tokenInfoMap.set(ticker.toUpperCase(), token);
      });

      // Calculate total supply per token from market cap data
      const tokenSupplies = new Map<string, number>();
      const blockchainTotals = new Map<string, number>();

      // Get blockchain columns (all columns except Ticker)
      const blockchainColumns = marketCapData.length > 0 
        ? Object.keys(marketCapData[0]).filter(k => k !== 'Ticker' && k !== 'ticker')
        : [];

      marketCapData.forEach(row => {
        const ticker = (row.Ticker || row.ticker || '').toUpperCase();
        if (!ticker) return;

        let tokenTotal = 0;
        blockchainColumns.forEach(chain => {
          const value = parseNumber(row[chain]);
          tokenTotal += value;
          blockchainTotals.set(chain, (blockchainTotals.get(chain) || 0) + value);
        });

        tokenSupplies.set(ticker, tokenTotal);
      });

      const totalSupply = Array.from(tokenSupplies.values()).reduce((sum, val) => sum + val, 0);

      // Build top stablecoins list
      const topStablecoins: TokenData[] = Array.from(tokenSupplies.entries())
        .map(([ticker, supply]) => {
          const info = tokenInfoMap.get(ticker) || {};
          return {
            ticker,
            issuer: info.Issuer || info.issuer || 'Unknown',
            supply,
            marketShare: totalSupply > 0 ? (supply / totalSupply) * 100 : 0,
            stablecoinType: info.StablecoinType || info['Stablecoin Type'] || info.Type || 'Unknown',
            regulatoryFramework: info.RegulatoryFramework || info['Regulatory Framework'] || info.Regulation || 'Unknown',
            status: info.Status || info.status || 'Unknown',
          };
        })
        .filter(t => t.supply > 0)
        .sort((a, b) => b.supply - a.supply);

      // Calculate breakdowns
      const backingGroups = new Map<string, number>();
      const regulatoryGroups = new Map<string, number>();

      topStablecoins.forEach(token => {
        const backing = token.stablecoinType || 'Unknown';
        const regulatory = token.regulatoryFramework || 'Unknown';
        
        backingGroups.set(backing, (backingGroups.get(backing) || 0) + token.supply);
        regulatoryGroups.set(regulatory, (regulatoryGroups.get(regulatory) || 0) + token.supply);
      });

      const byBackingType: BreakdownItem[] = Array.from(backingGroups.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalSupply > 0 ? (value / totalSupply) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      const byRegulatoryStatus: BreakdownItem[] = Array.from(regulatoryGroups.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalSupply > 0 ? (value / totalSupply) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      const byBlockchain: BreakdownItem[] = Array.from(blockchainTotals.entries())
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalSupply > 0 ? (value / totalSupply) * 100 : 0,
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);

      // Parse issuers
      const issuers: IssuerData[] = issuerData
        .filter(row => row.Issuer || row.issuer)
        .map(row => ({
          issuer: row.Issuer || row.issuer || '',
          ticker: row.Ticker || row.ticker || '',
          headquarters: row.Headquarters || row.HQ || row.headquarters || '',
          regulation: row.Regulation || row.RegulatoryFramework || row['Regulatory Framework'] || '',
          backing: row.Backing || row.StablecoinType || row['Stablecoin Type'] || '',
          status: row.Status || row.status || '',
        }));

      const stats: StablecoinStats = {
        totalSupply,
        topStablecoins: topStablecoins.slice(0, 15),
        byBackingType,
        byRegulatoryStatus,
        byBlockchain,
        issuers,
        lastUpdated: new Date(),
      };

      cache = { data: stats, timestamp: Date.now() };
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
  };
}
