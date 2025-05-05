import { useState } from "react";
import { DollarSign, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AssetCollateral {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  currentPrice: number;
  collateralFactor: number;
  collateralValue: number;
  logoUrl: string;
}

interface LoanFormProps {
  assets: AssetCollateral[];
  maxLoanAmount: number;
  interestRate: number;
}

export default function LoanForm({ assets, maxLoanAmount, interestRate }: LoanFormProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [loanAmount, setLoanAmount] = useState("");
  
  // Calculate total available collateral
  const totalCollateral = assets.reduce((sum, asset) => {
    if (selectedAssets.includes(asset.id)) {
      return sum + asset.collateralValue;
    }
    return sum;
  }, 0);
  
  // Max loan amount is the lesser of maxLoanAmount or totalCollateral
  const effectiveMaxLoan = Math.min(maxLoanAmount, totalCollateral);
  
  // Calculate utilization ratio
  const utilizationRatio = loanAmount ? parseFloat(loanAmount) / effectiveMaxLoan : 0;
  
  // Toggle asset selection
  const toggleAsset = (assetId: string) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };
  
  // Handle loan amount change
  const handleLoanAmountChange = (value: string) => {
    if (value === "" || (/^\d*\.?\d*$/.test(value) && !isNaN(parseFloat(value)))) {
      setLoanAmount(value);
    }
  };
  
  // Set amount based on percentage of max
  const handlePercentage = (percentage: number) => {
    const calculatedAmount = (effectiveMaxLoan * percentage / 100).toFixed(2);
    setLoanAmount(calculatedAmount);
  };
  
  // Calculate estimated monthly interest
  const monthlyInterest = loanAmount ? (parseFloat(loanAmount) * interestRate / 100 / 12).toFixed(2) : "0.00";
  
  return (
    <div className="card p-6">
      <h2 className="text-xl font-medium mb-6">Borrow Stablecoins</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Select Collateral</h3>
        <div className="grid gap-3">
          {assets.map((asset) => (
            <div 
              key={asset.id}
              className={cn(
                "p-3 rounded-md border cursor-pointer",
                selectedAssets.includes(asset.id) 
                  ? "border-[var(--primary)] bg-[var(--primary)]/5" 
                  : "border-[var(--border-color)] hover:bg-[var(--border-color)]/10"
              )}
              onClick={() => toggleAsset(asset.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8">
                    <Image
                      src={asset.logoUrl}
                      alt={`${asset.symbol} logo`}
                      fill
                      className="object-contain rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/40?text=" + asset.symbol;
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{asset.symbol}</p>
                    <p className="text-xs text-[var(--secondary)]">{asset.quantity} tokens</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">${asset.collateralValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-[var(--secondary)]">Collateral Value</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <label htmlFor="loanAmount">Loan Amount (USDC)</label>
          <span className="text-[var(--secondary)]">
            Max: ${effectiveMaxLoan.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
          <div className="bg-[var(--border-color)]/20 flex items-center px-2">
            <DollarSign size={16} className="text-[var(--secondary)]" />
          </div>
          <input
            id="loanAmount"
            type="text"
            value={loanAmount}
            onChange={(e) => handleLoanAmountChange(e.target.value)}
            className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
            placeholder="0.00"
          />
        </div>
        
        <div className="flex gap-2 mt-2">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => handlePercentage(percent)}
              className="text-xs px-2 py-1 rounded-md border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 transition-colors"
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="rounded-md bg-[var(--border-color)]/10 p-4">
          <h3 className="text-sm font-medium mb-3">Loan Details</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--secondary)]">Collateral</span>
              <span>${totalCollateral.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--secondary)]">Interest Rate</span>
              <span>{interestRate.toFixed(2)}% APR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--secondary)]">Est. Monthly Interest</span>
              <span>${monthlyInterest}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--secondary)]">Term</span>
              <span>Flexible</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--secondary)]">Utilization Ratio</span>
          <span>{(utilizationRatio * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={cn(
              "progress-bar-fill",
              utilizationRatio > 0.9 ? "bg-[var(--danger)]" :
              utilizationRatio > 0.75 ? "bg-[var(--warning)]" :
              "bg-[var(--primary)]"
            )}
            style={{ width: `${utilizationRatio * 100}%` }}
          />
        </div>
        
        <div className="flex items-start gap-2 mt-3 text-xs text-[var(--secondary)]">
          <Info size={14} className="shrink-0 mt-0.5" />
          <p>For optimal safety, we recommend keeping your utilization ratio below 75%.</p>
        </div>
      </div>
      
      <button
        className={cn(
          "w-full py-3 rounded-md font-medium",
          selectedAssets.length > 0 && loanAmount && parseFloat(loanAmount) <= effectiveMaxLoan
            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
            : "bg-[var(--border-color)]/50 text-[var(--secondary)] cursor-not-allowed"
        )}
        disabled={!(selectedAssets.length > 0 && loanAmount && parseFloat(loanAmount) <= effectiveMaxLoan)}
      >
        Borrow USDC
      </button>
      
      <div className="mt-4 text-xs text-[var(--secondary)]">
        <p>By taking this loan, you agree to our Terms of Service and acknowledge that your collateral may be liquidated if your position falls below the minimum collateral ratio.</p>
      </div>
    </div>
  );
} 