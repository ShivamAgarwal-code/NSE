"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, usePublicClient } from "wagmi";
import { Wallet, Loader2 } from "lucide-react";
import { KES_TOKEN_ADDRESS, LENDER_CONTRACT_ADDRESS } from "@/config/contracts";
import lenderABI from "@/abi/Lender.json";
import htsABI from "@/abi/HederaTokenService.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";

interface SupplyFormProps {
  assetAddress?: string;
}

interface SupplyFormData {
  amount: string;
}

export default function SupplyForm({ 
  assetAddress,
}: SupplyFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<SupplyFormData>({
    defaultValues: {
      amount: "",
    },
  });

  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  // Get KES balance for the connected wallet
  const { data: kesBalance, refetch: refetchKesBalance } = useBalance({
    address: address,
    token: KES_TOKEN_ADDRESS as `0x${string}`,
  });

  // Format KES balance
  const formattedKesBalance = kesBalance ? 
    (Number(kesBalance.value) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 
    "0";
  
  const { writeContractAsync } = useWriteContract();
  const { data: supplyHash } = useWriteContract();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: supplyHash,
  });

  const contractConfig = {
    address: formatAddress(LENDER_CONTRACT_ADDRESS),
    abi: lenderABI.abi as Abi,
    functionName: "provideLiquidity",
  } as const;

  // Set amount based on percentage of max allowable amount
  const handlePercentage = (percentage: number) => {
    const maxAmount = Number(formattedKesBalance.toString().replace(/,/g, ''));
    if (maxAmount > 0) {
      const calculatedAmount = (maxAmount * percentage / 100).toFixed(0);
      setValue("amount", calculatedAmount);
    } else {
      toast({
        title: "Insufficient Balance",
        description: "You don't have any KES balance to supply.",
        variant: "destructive"
      });
    }
  };

  // Handle supply submission
  const onSubmit = async (data: SupplyFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to supply KES.",
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

    if (!assetAddress) {
      toast({
        title: "Invalid Asset",
        description: "Please select an asset to supply.",
        variant: "destructive"
      });
      return;
    }

    if (Number(data.amount) > Number(formattedKesBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formattedKesBalance} KES available to supply.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate the amount in KES (6 decimals)
      const amountInKes = BigInt(Math.floor(Number(data.amount) * 1e6));
      
      // First approve KES spending using HTS
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`, // HTS Precompile address
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [
          KES_TOKEN_ADDRESS, // Token address
          formatAddress(LENDER_CONTRACT_ADDRESS), // Spender address
          amountInKes
        ],
      });

      toast({
        title: "Approval in progress",
        description: "Waiting for approval transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: approvalHash });

      toast({
        title: "Approval successful",
        description: "Approval transaction confirmed.",
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      // Then supply the KES
      const supplyHash = await writeContractAsync({
        ...contractConfig,
        args: [formatAddress(assetAddress), amountInKes],
      });

      toast({
        title: "Supply in progress",
        description: "Waiting for supply transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: supplyHash });

      setValue("amount", "");
      
      toast({
        title: "Supply successful",
        description: `You have successfully supplied ${data.amount} KES.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });
      
    } catch (error) {
      console.error("Supply error:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to complete the transaction.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      refetchKesBalance();
    }
  };

  const isSubmitting = isLoading || isWaiting;
  const buttonDisabled = !watch("amount") || isSubmitting || !isConnected || Number(watch("amount")) <= 0;

  return (
    <div className="card">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="supply-amount" className="text-sm mb-1 block">
                Amount
              </label>
            </div>
            <div className="flex items-end">
              <span className="text-[var(--secondary)] text-xs pr-1">Balance: </span>
              <span className="text-xs font-semibold">{formattedKesBalance}</span>
            </div>
          </div>
          
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">KES</span>
            </div>
            <input
              id="supply-amount"
              type="text"
              {...register("amount")}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-between text-sm mb-1">
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => handlePercentage(percent)}
                  className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 transition-colors"
                  disabled={isSubmitting}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mb-4 p-3 rounded-md bg-[var(--border-color)]/10">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Total</span>
            <span>KES {watch("amount") ? parseFloat(watch("amount")).toLocaleString('en-US', { maximumFractionDigits: 0 }) : "0"}</span>
          </div>
        </div>
        
        <button
          type="submit"
          className={cn(
            "w-full py-3 rounded-md font-medium",
            "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
            buttonDisabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={buttonDisabled}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" /> Supply KES
            </span>
          )}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By supplying KES, you agree to our Terms of Service and Privacy Policy. You will receive LP tokens in return for your supply.</p>
        </div>
      </form>
    </div>
  );
} 