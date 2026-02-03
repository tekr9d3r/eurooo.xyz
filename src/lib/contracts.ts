// Contract addresses for EURC/EURe/EURCV and DeFi protocols

export const EURC_ADDRESSES = {
  // Ethereum Mainnet (EURC)
  1: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c' as const,
  // Base (EURC)
  8453: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as const,
  // Gnosis (EURe)
  100: '0xcB444e90D8198415266c6a2724b7900fb12FC56E' as const,
  // Avalanche (EURC) - checksummed
  43114: '0xC891EB4CbdEFf6e073e859e987815Ed1505c2ACD' as const,
} as const;

// EURCV token address (Ethereum only - used by Morpho Prime vault)
export const EURCV_ADDRESS = '0x5F227B47CA59c59F16Ce6E7BC7382D693C804A46' as const;

// ============= AAVE V3 =============
export const AAVE_V3_POOL_ADDRESSES = {
  // Ethereum Mainnet
  1: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as const,
  // Base
  8453: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
  // Gnosis
  100: '0xb50201558B00496A145fE76f7424749556E326D8' as const,
  // Avalanche
  43114: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const,
} as const;

export const AAVE_V3_POOL_DATA_PROVIDER = {
  // Ethereum Mainnet
  1: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as const,
  // Base  
  8453: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac' as const,
  // Gnosis
  100: '0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741' as const,
  // Avalanche
  43114: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as const,
} as const;

// aEURC/aEURe token addresses (receipt tokens for Aave deposits)
export const AAVE_AEURC_ADDRESSES = {
  // aEURC on Ethereum Mainnet
  1: '0xAA6e91C82942aeAE040303Bf96c15a6dBcB82CA0' as const,
  // aBasEURC on Base
  8453: '0x90Da57E0a6C0D166Bf15764E03B83745dC90025B' as const,
  // aGnoEURe on Gnosis
  100: '0xEdBC7449a9b594CA4E053D9737EC5Dc4CbCcBfb2' as const,
  // aAvaEURC on Avalanche (from Aave address book)
  43114: '0x8a9FdE6925a839F6B1932d16B36aC026F8d3FbdB' as const,
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
// Morpho ERC-4626 vaults for EURC
export const MORPHO_VAULT_ADDRESSES = {
  // Ethereum vaults
  'morpho-gauntlet': {
    1: '0x2ed10624315b74a78f11FAbedAa1A228c198aEfB' as const,
  },
  'morpho-prime': {
    1: '0x34eCe536d2ae03192B06c0A67030D1Faf4c0Ba43' as const,
  },
  'morpho-kpk': {
    1: '0x0c6aec603d48eBf1cECc7b247a2c3DA08b398DC1' as const,
  },
  // Base vaults
  'morpho-moonwell': {
    8453: '0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026' as const,
  },
  'morpho-steakhouse': {
    8453: '0xBeEF086b8807Dc5E5A1740C5E3a7C4c366eA6ab5' as const,
  },
  'morpho-steakhouse-prime': {
    8453: '0xbeef009F28cCf367444a9F79096862920e025DC1' as const,
  },
} as const;

// ============= FLUID =============
// Fluid fToken vaults (ERC-4626)
export const FLUID_VAULT_ADDRESSES = {
  // fEURC on Base
  8453: '0x1943FA26360f038230442525Cf1B9125b5DCB401' as const,
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
