"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { Wallet, Loader2, Droplet } from "lucide-react";
import { KES_CONTRACT_TOKEN_ADDRESS } from "@/config/contracts";
import kesABI from "@/abi/KES.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";

interface FaucetFormData {
  amount: number;
}

export default function Faucet() {
  const { handleSubmit, setValue, register } = useForm<FaucetFormData>({
    defaultValues: {
      amount: 10000,
    },
  });

  const { isConnected } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { data: requestHash } = useWriteContract();
  const publicClient = usePublicClient();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: requestHash,
  });

  const onSubmit = async (data: FaucetFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to request tokens.",
        variant: "destructive"
      });
      return;
    }
    
    if (!data.amount || Number(data.amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Ensure we have a valid number before conversion
      const numericAmount = Number(data.amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid amount provided");
      }
      
      // Convert amount to uint64 (matches the contract's expected type)
      const amountInKes = BigInt(Math.floor(numericAmount * 1e6));
      console.log("Amount in KES:", amountInKes);
      
      const hash = await writeContractAsync({
        address: formatAddress(KES_CONTRACT_TOKEN_ADDRESS),
        abi: kesABI.abi as Abi,
        functionName: "requestAirdrop",
        args: [amountInKes],
      });

      toast({
        title: "Request initiated",
        description: "Waiting for tokens to be sent to your wallet...",
      });

      await publicClient?.waitForTransactionReceipt({ hash: hash as `0x${string}` });

      toast({
        title: "Tokens received",
        description: `You have received ${numericAmount} KES. You can now use them in the protocol.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      setValue("amount", 0);
      
    } catch (error) {
      console.error("Faucet request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request tokens. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || isWaiting;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Droplet className="w-6 h-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-semibold">Token Faucet</h1>
        </div>
        
        <p className="text-[var(--secondary)] mb-6">
          Request KES test tokens to use in the Hedgehog Protocol. These tokens can be used for testing trading, lending, and other protocol features.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount (KES)
            </label>
            <input
              type="number"
              id="amount"
              {...register("amount", { 
                required: "Amount is required",
                min: {
                  value: 0,
                  message: "Amount must be greater than 0"
                },
                valueAsNumber: true
              })}
              className="w-full px-4 py-2 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Enter amount"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isConnected}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
              isConnected
                ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                : "bg-[var(--border-color)] text-[var(--secondary)] cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </>
            ) : (
              <>
                <Droplet className="w-4 h-4" />
                <span>Request Tokens</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}