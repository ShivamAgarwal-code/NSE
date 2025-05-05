"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, usePublicClient } from "wagmi";
import { Wallet, Loader2 } from "lucide-react";
import { LENDER_CONTRACT_ADDRESS, KES_TOKEN_ADDRESS} from "@/config/contracts";
import lenderABI from "@/abi/Lender.json";
import htsABI from "@/abi/HederaTokenService.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";

interface RepayFormProps {
  assetAddress?: string;
  outstandingDebt?: number;
  repaymentAmount?: number;
  defaultAmount?: number;
}

interface RepayFormData {
  amount: string;
}

export default function RepayForm({ 
  assetAddress,
  outstandingDebt = 0,
  repaymentAmount = 0,
  defaultAmount = 0,
}: RepayFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm<RepayFormData>({
    defaultValues: {
      amount: defaultAmount.toString(),
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

  // Format KES balance with 6 decimals
  const formattedKesBalance = kesBalance ? 
    (Number(kesBalance.value) / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
    "0.00";
  
  const { writeContractAsync } = useWriteContract();
  const { data: repayHash } = useWriteContract();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: repayHash,
  });

  const contractConfig = {
    address: formatAddress(LENDER_CONTRACT_ADDRESS),
    abi: lenderABI.abi as Abi,
    functionName: "repayOutstandingLoan",
  } as const;

  // Set amount based on percentage of outstanding debt
  const handlePercentage = (percentage: number) => {
    if (outstandingDebt > 0) {
      const calculatedAmount = (outstandingDebt * percentage / 100).toFixed(2);
      setValue("amount", calculatedAmount);
    } else {
      toast({
        title: "No Outstanding Debt",
        description: "You don't have any debt to repay.",
        variant: "destructive"
      });
    }
  };

  // Handle repay submission
  const onSubmit = async (data: RepayFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to repay.",
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

    if (Number(data.amount) > repaymentAmount) {
      toast({
        title: "Exceeds Outstanding Debt",
        description: `You only have ${repaymentAmount.toLocaleString()} KES of debt to repay.`,
        variant: "destructive"
      });
      return;
    }

    if (!assetAddress) {
      toast({
        title: "Invalid Asset",
        description: "Please select an asset to repay.",
        variant: "destructive"
      });
      return;
    }

    const amountNumber = Number(data.amount);
    if (amountNumber > Number(formattedKesBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formattedKesBalance} KES available.`,
        variant: "destructive"
      });
      return;
    }

    if (!publicClient) {
      toast({
        title: "Error",
        description: "Failed to initialize public client.",
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate the amount in KES (6 decimals)
      const amountInKes = BigInt(Math.floor(amountNumber * 1e6));
      
      // First approve KES spending using HTS
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`, // HTS Precompile address
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [
          KES_TOKEN_ADDRESS, // KES Token address
          LENDER_CONTRACT_ADDRESS, // Spender address
          amountInKes
        ],
      });

      toast({
        title: "Approval in progress",
        description: "Waiting for approval transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient.waitForTransactionReceipt({ hash: approvalHash });

      toast({
        title: "Approval successful",
        description: "Approval transaction confirmed.",
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      // Then repay the loan
      const repayHash = await writeContractAsync({
        ...contractConfig,
        args: [formatAddress(assetAddress)],
      });

      toast({
        title: "Repayment in progress",
        description: "Waiting for repayment transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient.waitForTransactionReceipt({ hash: repayHash });

      setValue("amount", "");
      
      toast({
        title: "Repayment successful",
        description: `You have successfully repaid ${data.amount} KES.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });
      
    } catch (error) {
      console.error("Repay error:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to complete the transaction.",
        className: "bg-red-500 text-white border-none",
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
            <label htmlFor="repay-amount" className="text-sm mb-1 block">
              Amount (KES)
            </label>
            <div className="flex items-end gap-4">
              <div>
                <span className="text-[var(--secondary)] text-xs pr-1"> Debt: </span>
                <span className="text-xs">{outstandingDebt.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[var(--secondary)] text-xs pr-1">Repayment Amount: </span>
                <span 
                  className="text-xs cursor-pointer hover:text-[var(--primary)]"
                  onClick={() => setValue("amount", repaymentAmount.toString())}
                >
                  {repaymentAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">KES</span>
            </div>
            <input
              id="repay-amount"
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
            <span>KES {watch("amount") ? parseFloat(watch("amount")).toLocaleString('en-US', { maximumFractionDigits: 2 }) : "0.00"}</span>
          </div>
        </div>
        
        <button
          type="submit"
          className={cn(
            "w-full py-3 rounded-md font-medium",
            "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90",
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
              <Wallet className="w-4 h-4" /> Repay KES
            </span>
          )}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By repaying your loan, you&apos;ll reduce your debt and improve your health factor. This will help protect your collateral from liquidation.</p>
        </div>
      </form>
    </div>
  );
} 