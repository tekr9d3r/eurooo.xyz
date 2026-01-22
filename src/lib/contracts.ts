// Contract addresses for EURC and DeFi protocols

export const EURC_ADDRESSES = {
  // Ethereum Mainnet
  1: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c' as const,
  // Base
  8453: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as const,
} as const;

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
  1: '0x8437d7C167dFB82ED4Cb79CD44B7a32A1e8C2e88' as const,
  // aBasEURC on Base - verified from Aave app
  8453: '0x90da57e0a6c0d166bf15764e03b83745dc90025b' as const,
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
