// Stub for @solana/wallet-adapter-react
export const useWallet = () => ({
  wallet: null,
  wallets: [],
  publicKey: null,
  connected: false,
  connecting: false,
  disconnecting: false,
  select: () => {},
  connect: async () => {},
  disconnect: async () => {},
  sendTransaction: async () => { throw new Error('Solana not supported'); },
  signTransaction: undefined,
  signAllTransactions: undefined,
  signMessage: undefined,
});
export default {};
