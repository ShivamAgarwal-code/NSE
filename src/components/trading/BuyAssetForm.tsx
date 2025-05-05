"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAccount, useWriteContract, useBalance, usePublicClient } from "wagmi";
import { ArrowDown, Wallet, Loader2 } from "lucide-react";
import { ISSUER_CONTRACT_ADDRESS, KES_TOKEN_ADDRESS } from "@/config/contracts";
import issuerABI from "@/abi/Issuer.json";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi, encodeFunctionData } from "viem";
import htsABI from "@/abi/HederaTokenService.json";
import { adminClient, adminAccount } from "@/lib/admin";

interface BuyAssetFormProps {
  assetName?: string;
  assetSymbol?: string;
  assetPrice?: number;
  tokenizedSymbol?: string;
  assetContractAddress?: string;
  refetchTransactions?: () => void;
}

interface BuyAssetFormData {
  amount: string;
  quantity: string;
}

export default function BuyAssetForm({
  assetName,
  assetPrice,
  tokenizedSymbol,
  assetContractAddress,
  refetchTransactions,
}: BuyAssetFormProps) {
  const { handleSubmit, setValue, watch } = useForm<BuyAssetFormData>({
    defaultValues: { amount: "", quantity: "" },
  });

  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const amount = watch("amount");
  const quantity = watch("quantity");

  // TUSDC balance
  const { data: kesBalance, refetch: refetchKesBalance } = useBalance({
    address,
    token: KES_TOKEN_ADDRESS as `0x${string}`,
  });

  const formattedKesBalance = kesBalance
    ? (Number(kesBalance.value) / 1e6).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const contractConfig = {
    address: formatAddress(ISSUER_CONTRACT_ADDRESS),
    abi: issuerABI.abi as Abi,
    functionName: "purchaseAsset",
  } as const;

  // Input handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("amount", value);
    if (value && assetPrice) {
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
      setValue("amount", (Number(value) * assetPrice).toFixed(0));
    } else {
      setValue("amount", "");
    }
  };

   // Set amount based on percentage of max allowable amount
   const handlePercentage = (percentage: number) => {
    const maxAmount = Number(formattedKesBalance.toString().replace(/,/g, ''));
    if (maxAmount > 0) {
      const calculatedAmount = (maxAmount * percentage / 100).toFixed(0);
      setValue("amount", calculatedAmount);
    } else {
      toast({
        title: "Insufficient Balance",
        description: "You don't have any KES balance to trade with.",
        variant: "destructive"
      });
    }
  };

  // Submission handler
  const onSubmit = async (data: BuyAssetFormData) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tokens.",
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    if (!data.amount || !data.quantity || Number(data.quantity) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid amount and quantity.",
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    setIsLoading(true);

    try {
      const amountInKes = BigInt(Math.floor(Number(data.amount) * 1e6));
      console.log(amountInKes);

      if (!assetContractAddress) {
        toast({
          title: "Error",
          description: "Asset contract address is not defined.",
          className: "bg-red-500 text-white border-none",
        });
        return;
      }

      // Grant KYC to the user using admin client
      if (!publicClient) {
        toast({
          title: "Error",
          description: "Failed to initialize public client.",
          className: "bg-red-500 text-white border-none",
        });
        return;
      }

      console.log('Admin account address:', adminAccount.address);
      console.log('Expected admin address:', process.env.NEXT_PUBLIC_ADMIN_ADDRESS);
      console.log('Admin account details:', {
        address: adminAccount.address,
        publicKey: adminAccount.publicKey,
        type: adminAccount.type
      });

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

      // Approval transaction with 2x amount
      const approvalAmount = amountInKes * BigInt(2);
      const approvalHash = await writeContractAsync({
        address: "0x0000000000000000000000000000000000000167" as `0x${string}`,
        abi: htsABI.abi as Abi,
        functionName: "approve",
        args: [KES_TOKEN_ADDRESS, formatAddress(ISSUER_CONTRACT_ADDRESS), approvalAmount],
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

      // Purchase transaction
      const roundedQuantity = Math.round(Number(data.quantity));
      const purchaseHash = await writeContractAsync({
        ...contractConfig,
        args: [assetName, BigInt(roundedQuantity)],
      });

      toast({
        title: "Purchase in progress",
        description: "Waiting for purchase transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: purchaseHash });

      toast( {
        title: "Purchase successful",
        description: `You have successfully purchased ${roundedQuantity} ${assetName} shares.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      // Reset form and refetch data
      setValue("amount", "");
      setValue("quantity", "");
      refetchKesBalance();
      refetchTransactions?.();
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to complete the transaction.",
        className: "bg-red-500 text-white border-none",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonDisabled = !amount || !quantity || isLoading || !isConnected || Number(quantity) <= 0;

  return (
    <div className="card">
      <form onSubmit={handleSubmit(onSubmit)} className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <label htmlFor="buy-amount" className="text-sm mb-1 block">
              Amount
            </label>
            <div className="flex items-end">
              <span className="text-[var(--secondary)] text-xs pr-1">Balance: </span>
              <span className="text-xs font-semibold">{formattedKesBalance} KES</span>
            </div>
          </div>
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">KES</span>
            </div>
            <input
              id="buy-amount"
              type="number"
              onChange={handleAmountChange}
              value={amount}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
              disabled={isLoading}
            />
          </div>
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

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute border-t border-[var(--border-color)] w-full"></div>
          <div className="bg-[var(--card-bg)] relative px-2 z-10">
            <ArrowDown className="w-5 h-5 text-[var(--secondary)]" />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="buy-quantity" className="text-sm mb-1 block">
            You&apos;ll Receive ({assetName})
          </label>
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">{assetName}</span>
            </div>
            <input
              id="buy-quantity"
              type="number"
              onChange={handleQuantityChange}
              value={quantity}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mb-4 p-3 rounded-md bg-[var(--border-color)]/10">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Price</span>
            <span>
              KES{" "}
              {assetPrice ? assetPrice.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Total</span>
            <span>
              KES{" "}
              {amount ? parseFloat(amount).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={cn(
            "w-full py-3 rounded-md font-medium",
            "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]",
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
              <Wallet className="w-4 h-4" /> Buy {tokenizedSymbol}
            </span>
          )}
        </button>

        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>
            By submitting this order, you agree to our Terms of Service and Privacy Policy. Market
            conditions may affect final settlement price.
          </p>
        </div>
      </form>
    </div>
  );
}