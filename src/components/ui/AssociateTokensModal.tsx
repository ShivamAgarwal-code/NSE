"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { Loader2 } from "lucide-react";
import htsABI from "@/abi/HederaTokenService.json"; // ABI for HTS system contract
import { cn } from "@/lib/utils"; // Utility for className concatenation
import { useToast } from "@/components/ui/use-toast"; // Toast notification hook
import { formatAddress } from "@/lib/wagmi"; // Utility to format addresses
import { Abi, encodeFunctionData } from "viem"; // Viem utilities for contract interaction
import { assets } from "@/data/marketData"; // Array of token data
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // UI components for modal

const TOKENS_ASSOCIATED_KEY = "tokens_associated";

// Function to get Hedera account ID from EVM address
async function getHederaAccountId(evmAddress: string) {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress.toLowerCase()}`
    );
    const data = await response.json();
    console.log("Hedera account ID:", data);
    if (data.account) {
      return data.account; // Returns "0.0.12345"
    } else {
      throw new Error("Account not found");
    }
  } catch (error) {
    console.error("Error fetching account ID:", error);
    return null;
  }
}

// Function to get associated tokens for a Hedera account ID
async function getAssociatedTokens(accountId: string) {
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/tokens`
    );
    const data = await response.json();
    console.log("Associated tokens:", data);
    if (data.tokens) {
      // Filter out tokens with automatic association enabled
      const tokenIds = data.tokens
        .filter((token: { automatic_association: boolean }) => !token.automatic_association)
        .map((token: { token_id: string }) => token.token_id);
      return tokenIds;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching associated tokens:", error);
    return [];
  }
}

export const AssociateTokensModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount(); // Wagmi hook for wallet info
  const { writeContractAsync } = useWriteContract(); // Wagmi hook for contract writes
  const publicClient = usePublicClient(); // Wagmi hook for public client
  const { toast } = useToast(); // Hook for showing notifications

  // Extract required token IDs from assets (assumes tokenId is in "0.0.num" format)
  const requiredTokenIds = assets.map((asset) => asset.tokenId);
  console.log("Required token IDs:", requiredTokenIds);

  // Effect to check token associations when wallet connects
  useEffect(() => {
    const checkAssociations = async () => {
      if (isConnected && address) {
        const accountId = await getHederaAccountId(address);
        if (accountId) {
          const associatedTokens = await getAssociatedTokens(accountId);
        //   console.log("Associated tokens:", associatedTokens);
          const allAssociated = requiredTokenIds.every((tokenId) =>
            associatedTokens.includes(tokenId)
          );
        //   console.log("All associated:", allAssociated);
          if (!allAssociated) {
            setIsOpen(true); // Show modal if any token is not associated
          } else {
            localStorage.setItem(TOKENS_ASSOCIATED_KEY, "true");
            setIsOpen(false); // Hide modal if all tokens are associated
          }
        } else {
          // Fallback: show modal if account ID fetch fails
          setIsOpen(true);
        }
      }
    };
    checkAssociations();
  }, [isConnected, address, requiredTokenIds]);

  // Function to associate tokens with the user's wallet
  const handleAssociateTokens = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to associate tokens.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare contract addresses (EVM format) for association
      const contractAddresses = assets.map((asset) =>
        formatAddress(asset.contractAddress)
      ) as `0x${string}`[];
      console.log("Contract addresses:", contractAddresses);

      // Encode function data for associateTokens call
      const data = encodeFunctionData({
        abi: htsABI.abi,
        functionName: "associateTokens",
        args: [address, contractAddresses],
      });

      // HTS system contract address on Hedera testnet
      const contractAddress = "0x0000000000000000000000000000000000000167" as `0x${string}`;

      // Estimate gas with a buffer
      let gasLimit;
      try {
        const gasEstimate = await publicClient?.estimateGas({
          account: address,
          to: contractAddress,
          data: data,
        });
        gasLimit = BigInt(Math.ceil(Number(gasEstimate) * 10.5)); // 10% buffer
        // console.log("Estimated gas with buffer:", gasLimit);
      } catch (estimationError) {
        console.error("Gas estimation failed:", estimationError);
        toast({
          title: "Gas estimation failed",
          description: "Using default gas limit for the transaction.",
          variant: "destructive",
        });
        gasLimit = BigInt(10000000); // Fallback gas limit
      }

      // Execute the contract write to associate tokens
      const associateHash = await writeContractAsync({
        address: contractAddress,
        abi: htsABI.abi as Abi,
        functionName: "associateTokens",
        args: [address, contractAddresses],
        gas: gasLimit,
      });

      toast({
        title: "Token association in progress",
        description: "Waiting for token association to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      // Wait for transaction confirmation
      await publicClient?.waitForTransactionReceipt({ hash: associateHash });

      // Update local storage and UI
      localStorage.setItem(TOKENS_ASSOCIATED_KEY, "true");
      toast({
        title: "Token association successful",
        description: "All tokens have been associated with your account.",
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Token association error:", error);
      toast({
        title: "Token association failed",
        description:
          error instanceof Error ? error.message : "Failed to associate tokens.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Associate Tokens</DialogTitle>
          <DialogDescription>
            Associate all available tokens with your wallet to enable trading.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-[var(--secondary)]">
              Click the button below to associate all available tokens with your
              wallet.
            </p>
          </div>
          <button
            onClick={handleAssociateTokens}
            disabled={isLoading || !isConnected}
            className={cn(
              "w-full py-3 rounded-md font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
              (isLoading || !isConnected) && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Associating
                Tokens...
              </span>
            ) : (
              "Associate All Tokens"
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};