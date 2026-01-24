// Contract addresses for EURC and DeFi protocols

export const EURC_ADDRESSES = {
  // Ethereum Mainnet
  1: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c' as const,
  // Base
  8453: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as const,
} as const;

// ============= AAVE V3 =============
export const AAVE_V3_POOL_ADDRESSES = {
  // Ethereum Mainnet
  1: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as const,
  // Base
  8453: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
} as const;

export const AAVE_V3_POOL_DATA_PROVIDER = {
  // Ethereum Mainnet
  1: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as const,
  // Base  
  8453: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as const,
} as const;

// aEURC token addresses (receipt tokens for Aave deposits)
export const AAVE_AEURC_ADDRESSES = {
  // aEURC on Ethereum Mainnet (checksummed)
  1: '0x8437d7c167dFB82ED4Cb79CD44B7a32A1e8C2e88' as const,
  // aBasEURC on Base - verified from Aave app
  8453: '0x90Da57E0a6C0D166BF15764E03B83745Dc90025B' as const,
} as const;

// ============= SUMMER.FI (Lazy Summer Protocol) =============
// ERC-4626 vault for EURC on Base
export const SUMMER_VAULT_ADDRESSES = {
  // Only available on Base
  8453: '0x64db8f51f1bf7064bb5a361a7265f602d348e0f0' as const,
} as const;

// ============= YO PROTOCOL =============
// yoEUR vault for EURC (ERC-4626 compatible)
export const YO_VAULT_ADDRESSES = {
  // yoEUR on Base
  8453: '0x50c749ae210d3977adc824ae11f3c7fd10c871e9' as const,
} as const;

// yoGateway - single entry point for all YO vaults
export const YO_GATEWAY_ADDRESSES = {
  1: '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA' as const,
  8453: '0xF1EeE0957267b1A474323Ff9CfF7719E964969FA' as const,
} as const;

// ============= MORPHO =============
// Morpho ERC-4626 vaults for EURC on Ethereum
export const MORPHO_VAULT_ADDRESSES = {
  // Gauntlet EURC Core vault
  'morpho-gauntlet': {
    1: '0x2ed10624315b74a78f11FAbedAa1A228c198aEfB' as const,
  },
} as const;

// ERC20 ABI (includes approve for deposits)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Aave V3 Pool ABI (for supply)
export const AAVE_V3_POOL_ABI = [
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Aave Pool Data Provider ABI (for getReserveData)
export const AAVE_POOL_DATA_PROVIDER_ABI = [
  {
    inputs: [{ name: 'asset', type: 'address' }],
    name: 'getReserveData',
    outputs: [
      { name: 'unbacked', type: 'uint256' },
      { name: 'accruedToTreasuryScaled', type: 'uint256' },
      { name: 'totalAToken', type: 'uint256' },
      { name: 'totalStableDebt', type: 'uint256' },
      { name: 'totalVariableDebt', type: 'uint256' },
      { name: 'liquidityRate', type: 'uint256' },
      { name: 'variableBorrowRate', type: 'uint256' },
      { name: 'stableBorrowRate', type: 'uint256' },
      { name: 'averageStableBorrowRate', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint256' },
      { name: 'variableBorrowIndex', type: 'uint256' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC-4626 Vault ABI (used by Summer.fi and YO Protocol)
export const ERC4626_VAULT_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'asset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'previewDeposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'previewRedeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    name: 'redeem',
    outputs: [{ name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// YO Gateway ABI (for deposits/withdrawals via gateway)
export const YO_GATEWAY_ABI = [
  {
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'assets', type: 'uint256' },
    ],
    name: 'quotePreviewDeposit',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'shares', type: 'uint256' },
    ],
    name: 'quotePreviewWithdraw',
    outputs: [{ name: 'assets', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'assets', type: 'uint256' },
      { name: 'minSharesOut', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'partnerId', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'yoVault', type: 'address' },
      { name: 'shares', type: 'uint256' },
      { name: 'minAssetsOut', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'partnerId', type: 'uint256' },
    ],
    name: 'redeem',
    outputs: [{ name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// RAY = 10^27, used for Aave rate calculations
export const RAY = 10n ** 27n;
export const SECONDS_PER_YEAR = 31536000n;

// Convert Aave liquidity rate to APY percentage
export function liquidityRateToAPY(liquidityRate: bigint): number {
  // liquidityRate is in RAY units (27 decimals)
  // APY = ((1 + rate/SECONDS_PER_YEAR)^SECONDS_PER_YEAR - 1) * 100
  // Simplified: APY ≈ rate * 100 / RAY (for small rates)
  const rateAsNumber = Number(liquidityRate) / Number(RAY);
  return rateAsNumber * 100;
}
