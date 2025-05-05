"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract, usePublicClient } from "wagmi";
import { Wallet, Loader2 } from "lucide-react";
import { LENDER_CONTRACT_ADDRESS } from "@/config/contracts";
import lenderABI from "@/abi/Lender.json";
import htsABI from "@/abi/HederaTokenService.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";

interface WithdrawFormProps {
  assetAddress?: string;
}

interface WithdrawFormData {
  amount: string;
}

export default function WithdrawForm({ 
  assetAddress,
}: WithdrawFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<WithdrawFormData>({
    defaultValues: {
      amount: "",
    },
  });

  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [lpTokenAddress, setLpTokenAddress] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // Get LP token address for the asset
  const { data: lpTokenAddressData } = useReadContract({
    address: formatAddress(LENDER_CONTRACT_ADDRESS),
    abi: lenderABI.abi as Abi,
    functionName: "getLpTokenAddress",
    args: [formatAddress(assetAddress || "")],
  });

  // Set LP token address when data is available
  useEffect(() => {
    if (lpTokenAddressData) {
      setLpTokenAddress(lpTokenAddressData as string);
    }
  }, [lpTokenAddressData]);
  
  // Get LP token balance for the connected wallet
  const { data: lpTokenBalance, refetch: refetchLpBalance } = useBalance({
    address: address,
    token: lpTokenAddress as `0x${string}`,
  });

  // Format LP token balance with 6 decimals
  const formattedLpBalance = lpTokenBalance ? 
    (Number(lpTokenBalance.value) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
    "0.00";
  
  const { writeContractAsync } = useWriteContract();
  const { data: withdrawHash } = useWriteContract();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const contractConfig = {
    address: formatAddress(LENDER_CONTRACT_ADDRESS),
    abi: lenderABI.abi as Abi,
    functionName: "withdrawLiquidity",
  } as const;

  // Set amount based on percentage of max allowable amount
  const handlePercentage = (percentage: number) => {
    const maxAmount = Number(formattedLpBalance.toString().replace(/,/g, ''));
    if (maxAmount > 0) {
      const calculatedAmount = (maxAmount * percentage / 100).toFixed(2);
      setValue("amount", calculatedAmount);
    } else {
      toast({
        title: "No LP Tokens",
        description: "You don't have any LP tokens to withdraw.",
        variant: "destructive"
      });
    }
  };

  // Handle withdraw submission
  const onSubmit = async (data: WithdrawFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to withdraw.",
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

    if (Number(data.amount) > Number(formattedLpBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formattedLpBalance} LP tokens available to withdraw.`,
        variant: "destructive"
      });
      return;
    }

    if (!lpTokenAddress) {
      toast({
        title: "Error",
        description: "LP token address not found.",
        variant: "destructive"
      });
      return;
    }

    if (!assetAddress) {
      toast({
        title: "Error",
        description: "Asset address not found.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate the amount in LP tokens (6 decimals)
      const amountInLpTokens = BigInt(Math.floor(Number(data.amount) * 1e6));
      
      // First approve LP token spending using HTS
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`, // HTS Precompile address
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [
          lpTokenAddress, // LP Token address
          LENDER_CONTRACT_ADDRESS, // Spender address
          amountInLpTokens
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

      // Then withdraw the liquidity
      const withdrawHash = await writeContractAsync({
        ...contractConfig,
        args: [formatAddress(assetAddress), amountInLpTokens],
      });

      toast({
        title: "Withdrawal in progress",
        description: "Waiting for withdrawal transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: withdrawHash });

      setValue("amount", "");
      
      toast({
        title: "Withdrawal successful",
        description: `You have successfully withdrawn ${data.amount} KES.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });
      
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to complete the transaction.",
        className: "bg-red-500 text-white border-none",
      });
    } finally {
      setIsLoading(false);
      refetchLpBalance();
    }
  };

  const isSubmitting = isLoading || isWaiting;
  const buttonDisabled = !watch("amount") || isSubmitting || !isConnected || Number(watch("amount")) <= 0;

  return (
    <div className="card">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="withdraw-amount" className="text-sm mb-1 block">
              Amount (LP Tokens)
            </label>
            <div className="flex items-end">
              <span className="text-[var(--secondary)] text-xs pr-1">Balance: </span>
              <span className="text-xs">{formattedLpBalance}</span>
            </div>
          </div>
          
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">LP</span>
            </div>
            <input
              id="withdraw-amount"
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
            <span>LP {watch("amount") ? parseFloat(watch("amount")).toLocaleString('en-US', { maximumFractionDigits: 2 }) : "0.00"}</span>
          </div>
        </div>
        
        <button
          type="submit"
          className={cn(
            "w-full py-3 rounded-md font-medium",
            "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90",
            buttonDisabled && "opacity-70 cursor-not-allowed"
          )}
          disabled={buttonDisabled}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" /> Withdraw KES
            </span>
          )}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By withdrawing, you will burn your LP tokens and receive the underlying KES plus any earned interest.</p>
        </div>
      </form>
    </div>
  );
} 