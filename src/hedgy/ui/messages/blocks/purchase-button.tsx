"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useBalance, usePublicClient } from "wagmi";
import { Loader2 } from "lucide-react";
import { ISSUER_CONTRACT_ADDRESS, KES_TOKEN_ADDRESS } from "@/config/contracts";
import issuerABI from "@/abi/Issuer.json";
import htsABI from "@/abi/HederaTokenService.json";
import { useToast } from "@/components/ui/use-toast";
import { formatAddress } from "@/lib/wagmi";
import { Abi, encodeFunctionData } from "viem";
import { adminClient } from "@/lib/admin";
import { useAssetPrice } from "@/hooks/usePrices";
import { assets } from "@/data/marketData";


interface Props {
  assetName: string;
  quantity: number;
}

export function PurchaseButton(props: Props) {
  const { assetName, quantity } = props;
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  console.log("Asset Name::", assetName)
  console.log("Assets", assets)
  const asset = assets.find((asset) => asset.id === assetName.toLocaleLowerCase());
  console.log("Found asset::", asset)
  const { data: assetPriceData } = useAssetPrice(asset?.contractAddress || "");

  

  const assetPrice = (Number(assetPriceData))
  console.log("assetPrice:", assetPrice);

  // Get KES balance for refetching after purchase
  const { refetch: refetchKesBalance } = useBalance({
    address,
    token: KES_TOKEN_ADDRESS as `0x${string}`,
  });

  const contractConfig = {
    address: formatAddress(ISSUER_CONTRACT_ADDRESS),
    abi: issuerABI.abi as Abi,
    functionName: "purchaseAsset",
  } as const;

  const handlePurchase = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tokens.",
        className: "bg-red-500 text-white border-none",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!assetPriceData) return;

      // Calculate the amount in KES (6 decimals)
      const amountInKes = BigInt(Math.floor(quantity * assetPrice * 1e6));

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
        const asset = assets.find((asset) => asset.id === assetName.toLocaleLowerCase());
        const data = encodeFunctionData({
          abi: issuerABI.abi,
          functionName: 'grantKYC',
          args: [asset?.name, address],
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
          KES_TOKEN_ADDRESS, // Token address
          formatAddress(ISSUER_CONTRACT_ADDRESS), // Spender address
          amountInKes * BigInt(2) // Approve 2x amount for safety
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

      // Purchase transaction
      const purchaseHash = await writeContractAsync({
        ...contractConfig,
        args: [asset?.name, BigInt(quantity)],
      });

      toast({
        title: "Purchase in progress",
        description: "Waiting for purchase transaction to be confirmed...",
        className: "bg-yellow-500/50 border-yellow-500 text-white border-none",
      });

      await publicClient?.waitForTransactionReceipt({ hash: purchaseHash });

      toast({
        title: "Purchase successful",
        description: `You have successfully purchased ${quantity} ${assetName} shares.`,
        className: "bg-green-500/50 border-green-500 text-white border-none",
      });

      refetchKesBalance();
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

  return (
    <div className="w-full mt-2">
      <button 
        onClick={handlePurchase}
        disabled={isLoading || !isConnected}
        className="w-[88%] mx-auto px-4 py-2 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <span>
            Buy {quantity} {assetName}
          </span>
        )}
      </button>
    </div>
  );
}
