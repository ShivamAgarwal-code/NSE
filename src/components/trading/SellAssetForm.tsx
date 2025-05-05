"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useBalance, usePublicClient } from "wagmi";
import { ArrowDown, DollarSign, Loader2 } from "lucide-react";
import { ISSUER_CONTRACT_ADDRESS } from "@/config/contracts";
import issuerABI from "@/abi/Issuer.json";
import htsABI from "@/abi/HederaTokenService.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";

interface SellAssetFormProps {
  assetName?: string;
  assetPrice?: number;
  tokenizedSymbol?: string;
  assetContractAddress?: string;
  refetchTransactions?: () => void;
}

interface SellAssetFormData {
  amount: string;
  quantity: string;
}

export default function SellAssetForm({ 
  assetName,
  assetPrice,
  tokenizedSymbol,
  assetContractAddress,
  refetchTransactions,
}: SellAssetFormProps) {
  const { handleSubmit, setValue, watch } = useForm<SellAssetFormData>({
    defaultValues: {
      amount: "",
      quantity: "",
    },
  });

  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const amount = watch("amount");
  const quantity = watch("quantity");

  // Get hhSAF balance for the connected wallet
  const { data: hhSafBalance, refetch: refetchSafBalance } = useBalance({
    address: address,
    token: assetContractAddress as `0x${string}`,
  });

  // Format hhSAF balance
  const formattedHhSafBalance = hhSafBalance ? 
    Number(hhSafBalance.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 
    "0";
  
  const contractConfig = {
    address: formatAddress(ISSUER_CONTRACT_ADDRESS),
    abi: issuerABI.abi as Abi,
    functionName: "sellAsset",
  } as const;

  // Input handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("amount", value);
    if (value && assetPrice) {
      // Calculate quantity by dividing KES amount by asset price
      const calculatedQuantity = Number(value) / assetPrice;
      setValue("quantity", Math.round(calculatedQuantity).toFixed(2));
    } else {
      setValue("quantity", "");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("quantity", value);
    if (value && assetPrice) {
      // Calculate KES amount by multiplying quantity with asset price
      const kesAmount = (Number(value) * assetPrice).toFixed(0);
      setValue("amount", kesAmount);
    } else {
      setValue("amount", "");
    }
  };

  // Set quantity based on percentage of max allowable amount
  const handlePercentage = (percentage: number) => {
    const maxQuantity = Number(formattedHhSafBalance.toString().replace(/,/g, ''));
    if (maxQuantity > 0) {
      const calculatedQuantity = (maxQuantity * percentage / 100).toFixed(0);
      setValue("quantity", calculatedQuantity);
    } else {
      toast({
        title: "Insufficient Balance",
        description: "You don't have any hhSAF tokens to sell.",
        variant: "destructive"
      });
    }
  };

  // Handle sell submission
  const onSubmit = async (data: SellAssetFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to sell tokens.",
        variant: "destructive"
      });
      return;
    }
    
    if (!data.amount || !data.quantity || Number(data.quantity) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and quantity.",
        variant: "destructive"
      });
      return;
    }

    if (Number(data.quantity) > Number(formattedHhSafBalance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formattedHhSafBalance} hhSAF tokens available to sell.`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert quantity to uint64 (matches the contract's expected type)
      const quantityToSell = BigInt(Math.floor(Number(data.quantity)));

      // First approve the contract to spend hhSAF tokens
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`, // HTS Precompile address
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [
          assetContractAddress,
          formatAddress(ISSUER_CONTRACT_ADDRESS),
          quantityToSell
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

      // Then make the sale using the quantity
      const sellHash = await writeContractAsync({
        ...contractConfig,
        args: [assetName, quantityToSell],
      });

      toast({
        title: "Sale in progress",
        description: "Waiting for sale transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: sellHash });

      setValue("amount", "");
      setValue("quantity", "");
      
      toast({
        title: "Sale successful",
        description: `You have successfully sold ${data.quantity} ${assetName} shares.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });
      
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to complete the transaction.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      refetchSafBalance();
      refetchTransactions?.();
    }
  };

  const buttonDisabled = !amount || !quantity || isLoading || !isConnected || Number(quantity) <= 0;

  return (
    <div className="card">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="sell-quantity" className="text-sm mb-1 block">
              Quantity ({tokenizedSymbol})
            </label>
            <div className="flex items-end">
              <span className="text-[var(--secondary)] text-xs pr-1">Balance: </span>
              <span className="text-xs">{formattedHhSafBalance}</span>
            </div>
          </div>
          
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">{tokenizedSymbol}</span>
            </div>
            <input
              id="sell-quantity"
              type="number"
              onChange={handleQuantityChange}
              value={quantity}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
              disabled={isLoading}
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
                  disabled={isLoading}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute border-t border-[var(--border-color)] w-full"></div>
          <div className="bg-[var(--card-bg)] relative px-2 z-10">
            <ArrowDown className="w-5 h-5 text-[var(--secondary)]" />
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="sell-amount" className="text-sm mb-1 block">
              You&apos;ll Receive (KES)
            </label>
          </div>
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">KES</span>
            </div>
            <input
              id="sell-amount"
              type="number"
              onChange={handleAmountChange}
              value={amount}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="mb-4 p-3 rounded-md bg-[var(--border-color)]/10">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Price</span>
            <span>KES {assetPrice ? assetPrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Total</span>
            <span>KES {amount ? parseFloat(amount).toLocaleString('en-US', { maximumFractionDigits: 0 }) : "0"}</span>
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
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" /> Sell {tokenizedSymbol}
            </span>
          )}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By submitting this order, you agree to our Terms of Service and Privacy Policy. Market conditions may affect final settlement price.</p>
        </div>
      </form>
    </div>
  );
} 