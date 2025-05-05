import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hederaTestnet } from './wagmi';

if (!process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY) {
  throw new Error('NEXT_PUBLIC_ADMIN_PRIVATE_KEY is not defined');
}

if (!process.env.NEXT_PUBLIC_ADMIN_ADDRESS) {
  throw new Error('NEXT_PUBLIC_ADMIN_ADDRESS is not defined');
}

// Create admin account from private key
export const adminAccount = privateKeyToAccount(process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY as `0x${string}`);

// Verify the admin account address matches the expected address
if (adminAccount.address.toLowerCase() !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS.toLowerCase()) {
  throw new Error('Admin account address does not match the expected address');
}

// Create wallet client for admin
export const adminClient = createWalletClient({
  account: adminAccount,
  chain: hederaTestnet,
  transport: http(),
}); 