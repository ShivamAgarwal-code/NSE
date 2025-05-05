import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

// Define Hedera testnet as a custom chain
export const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://testnet.hashio.io/api'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || 'https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HashScan',
      url: 'https://hashscan.io/testnet',
    },
  },
  testnet: true,
})

// Create Wagmi config with Hedera testnet
export const config = createConfig({
  chains: [hederaTestnet],
  transports: {
    [hederaTestnet.id]: http(),
  },
})

// Type definitions for contract interaction
export type ContractAddress = `0x${string}`

// Helper function to ensure addresses are properly formatted
export function formatAddress(address: string): ContractAddress {
  // If address already starts with 0x, ensure it's the right format
  if (address?.startsWith('0x')) {
    return address as ContractAddress
  }
  
  // If it's not a 0x address, prepend 0x to make it compatible
  return `0x${address}` as ContractAddress
}

// Helper for contract arguments
export function formatArgs(args: unknown[]): unknown[] {
  return args.map(arg => 
    typeof arg === 'string' && !arg.startsWith('0x') && /^[0-9a-fA-F]+$/.test(arg) 
      ? `0x${arg}` 
      : arg
  )
}

export default config
