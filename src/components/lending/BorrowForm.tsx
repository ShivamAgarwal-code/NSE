"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, usePublicClient } from "wagmi";
import { Wallet, Loader2 } from "lucide-react";
import { ISSUER_CONTRACT_ADDRESS, KES_TOKEN_ADDRESS, LENDER_CONTRACT_ADDRESS } from "@/config/contracts";
import lenderABI from "@/abi/Lender.json";
import htsABI from "@/abi/HederaTokenService.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi } from "viem";
import { useForm } from "react-hook-form";
import { adminClient } from "@/lib/admin";
import { encodeFunctionData } from "viem";
import issuerABI from "@/abi/Issuer.json";
import { useAssetPrice } from "@/hooks/usePrices";


interface BorrowFormProps {
  assetAddress?: string;
  assetName?: string;
  collateralFactor: number;
  userAddress: `0x${string}` | undefined;
  tokenizedSymbol?: string;
}

interface BorrowFormData {
  amount: string;
  
}

export default function BorrowForm({ 
  assetAddress,
  assetName,
  collateralFactor,
  userAddress,
  tokenizedSymbol
}: BorrowFormProps) {
  const { handleSubmit, setValue, watch } = useForm<BorrowFormData>({
    defaultValues: {
      amount: "",
    },
  });
  
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  // Get USDC balance for the connected wallet
  const { refetch: refetchKesBalance } = useBalance({
    address: address,
    token: KES_TOKEN_ADDRESS as `0x${string}`,
  });

  const { data: balance } = useBalance({
    address: userAddress,
    token: assetAddress as `0x${string}`,
  });

  const { data: price } = useAssetPrice(assetAddress as `0x${string}`);

  const borrowLimit = Number(balance?.value) * Number(price) * collateralFactor;

  // Handle input change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty value or numbers with up to 2 decimal places
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      const numValue = parseFloat(value);
      if (value === "" || numValue <= borrowLimit) {
        setValue("amount", value);
      } else {
        // If value exceeds borrow limit, set it to the maximum allowed
        setValue("amount", borrowLimit.toString());
      }
    }
  };

  const { writeContractAsync } = useWriteContract();
  const { data: borrowHash } = useWriteContract();
  
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: borrowHash,
  });

  const contractConfig = {
    address: formatAddress(LENDER_CONTRACT_ADDRESS),
    abi: lenderABI.abi as Abi,
    functionName: "takeOutLoan",
  } as const;

  // Set amount based on percentage of max allowable amount
  const handlePercentage = (percentage: number) => {
    if (borrowLimit > 0) {
      const calculatedAmount = (borrowLimit * percentage / 100).toFixed(2);
      setValue("amount", calculatedAmount);
    } else {
      toast({
        title: "No Borrow Limit",
        description: "You don't have any borrow limit available.",
        variant: "destructive"
      });
    }
  };

  // Handle borrow submission
  const onSubmit = async (data: BorrowFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to borrow.",
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

    if (Number(data.amount) > borrowLimit) {
      toast({
        title: "Exceeds Borrow Limit",
        description: `You can only borrow up to ${borrowLimit.toLocaleString()} KES.`,
        variant: "destructive"
      });
      return;
    }

    if (!assetAddress) {
      toast({
        title: "Invalid Asset",
        description: "Please select an asset to borrow.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate the amount in KES (6 decimals)
      const amountInKes = (Math.floor(Number(data.amount) * 1e6));
      const quantity = Math.floor(Number(amountInKes)/Number(price));
      const roundedQuantity = Math.round(quantity);
      console.log(roundedQuantity);
      
      // Grant KYC to the user using admin client
      if (!publicClient) {
        toast({
          title: "Error",
          description: "Failed to initialize public client.",
          className: "bg-red-500 text-white border-none",
        });
        return;
      }

      try {
        const data = encodeFunctionData({
          abi: issuerABI.abi,
          functionName: 'grantKYC',
          args: [assetName, address],
        });

        const tx = {
          to: formatAddress(ISSUER_CONTRACT_ADDRESS),
          data,
        };
      
        const grantKycHash = await adminClient.sendTransaction(tx);

        toast({
          title: "KYC Grant in progress",
          description: "Waiting for KYC grant to be confirmed...",
          className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
        });

        await publicClient?.waitForTransactionReceipt({ hash: grantKycHash });

        toast({
          title: "KYC Grant successful",
          description: "KYC has been granted to your account.",
          className: "bg-green-500/50 border-green-500 text-white border-none",
        });
      } catch (error) {
        console.error('KYC Grant error:', error);
        toast({
          title: "KYC Grant Failed",
          description: error instanceof Error ? error.message : "Failed to grant KYC. Please try again.",
          className: "bg-red-500 text-white border-none",
        });
        return;
      }

      // First approve KES spending using HTS
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`, // HTS Precompile address
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [
          assetAddress, // Token address
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

      // Then take out the loan
      const borrowHash = await writeContractAsync({
        ...contractConfig,
        args: [formatAddress(assetAddress), BigInt(amountInKes)],
      });

      toast({
        title: "Borrow in progress",
        description: "Waiting for borrow transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: borrowHash });

      setValue("amount", "");
      
      toast({
        title: "Borrow successful",
        description: `You have successfully borrowed ${data.amount} KES.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });
      
    } catch (error) {
      console.error("Borrow error:", error);
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
            <label htmlFor="borrow-amount" className="text-sm mb-1 block">
              Amount (KES)
            </label>
            <div className="flex items-end">
              <span className="text-[var(--secondary)] text-xs pr-1">Borrow Limit: </span>
              <span className="text-xs font-semibold">{borrowLimit.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">KES</span>
            </div>
            <input
              id="borrow-amount"
              type="text"
              value={watch("amount")}
              onChange={handleAmountChange}
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
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Borrow Collateral</span>
            <span>{Number(watch("amount"))/Number(price)} {tokenizedSymbol}</span>
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
              <Wallet className="w-4 h-4" /> Borrow KES
            </span>
          )}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By borrowing, you agree to our Terms of Service and Privacy Policy. You will need to maintain a healthy collateral ratio to avoid liquidation.</p>
        </div>
      </form>
    </div>
  );
} 