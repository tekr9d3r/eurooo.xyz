export interface TokenOption {
  symbol: string;
  address: string;
  decimals: number;
}

export const NATIVE = '0x0000000000000000000000000000000000000000';

export const FROM_CHAINS = [
  { id: 1,     name: 'Ethereum' },
  { id: 8453,  name: 'Base' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10,    name: 'Optimism' },
  { id: 137,   name: 'Polygon' },
  { id: 43114, name: 'Avalanche' },
] as const;

export type SupportedChainId = (typeof FROM_CHAINS)[number]['id'];

export const FROM_TOKENS: Record<number, TokenOption[]> = {
  1: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6  },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6  },
    { symbol: 'EURC', address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c', decimals: 6  },
    { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  ],
  8453: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6  },
    { symbol: 'EURC', address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6  },
  ],
  42161: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6  },
    { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6  },
  ],
  10: [
    { symbol: 'ETH',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6  },
    { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6  },
  ],
  137: [
    { symbol: 'POL',  address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6  },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6  },
  ],
  43114: [
    { symbol: 'AVAX', address: NATIVE,                                         decimals: 18 },
    { symbol: 'USDC', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6  },
  ],
};
