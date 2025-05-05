import { useState } from "react";
import { cn } from "@/lib/utils";

interface TradeFormProps {
  symbol: string;
  tokenizedSymbol?: string;
  price: number;
  balance?: number;
}

type TradeType = "buy" | "sell";

export default function TradeForm({ symbol, tokenizedSymbol, price, balance = 500000 }: TradeFormProps) {
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  
  // Use tokenizedSymbol if available, otherwise use symbol
  const displaySymbol = tokenizedSymbol || symbol;
  
  // Calculate quantity based on amount
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(parseFloat(value)) && price) {
      const calculatedQuantity = (parseFloat(value) / price).toFixed(0);
      setQuantity(calculatedQuantity);
    } else {
      setQuantity("");
    }
  };
  
  // Calculate amount based on quantity
  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    if (value && !isNaN(parseFloat(value)) && price) {
      const calculatedAmount = (parseFloat(value) * price).toFixed(0);
      setAmount(calculatedAmount);
    } else {
      setAmount("");
    }
  };
  
  // Set amount based on percentage of balance
  const handlePercentage = (percentage: number) => {
    const maxAmount = tradeType === "buy" ? balance : parseFloat(quantity) * price;
    const calculatedAmount = (maxAmount * percentage / 100).toFixed(0);
    handleAmountChange(calculatedAmount);
  };
  
  return (
    <div className="card">
      <div className="flex border-b border-[var(--border-color)]">
        <button
          className={cn(
            "flex-1 py-3 font-medium text-sm transition-colors",
            tradeType === "buy" 
              ? "text-[var(--success)] border-b-2 border-[var(--success)]" 
              : "text-[var(--secondary)] hover:text-[var(--foreground)]"
          )}
          onClick={() => setTradeType("buy")}
        >
          Buy
        </button>
        <button
          className={cn(
            "flex-1 py-3 font-medium text-sm transition-colors",
            tradeType === "sell" 
              ? "text-[var(--danger)] border-b-2 border-[var(--danger)]" 
              : "text-[var(--secondary)] hover:text-[var(--foreground)]"
          )}
          onClick={() => setTradeType("sell")}
        >
          Sell
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <label htmlFor="amount">Amount (KES)</label>
            <span className="text-[var(--secondary)]">
              Balance: KES {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)]">KES</span>
            </div>
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
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
        
        <div className="mb-4">
          <label htmlFor="quantity" className="text-sm mb-1 block">
            Quantity ({displaySymbol})
          </label>
          <div className="flex rounded-md overflow-hidden border border-[var(--border-color)]">
            <div className="bg-[var(--border-color)]/20 flex items-center px-2">
              <span className="text-[var(--secondary)] text-sm">{displaySymbol}</span>
            </div>
            <input
              id="quantity"
              type="text"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="flex-1 bg-transparent outline-none py-2 px-3 w-full"
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="mb-4 p-3 rounded-md bg-[var(--border-color)]/10">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Price</span>
            <span>KES {price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--secondary)]">Total</span>
            <span>KES {amount ? parseFloat(amount).toLocaleString('en-US', { maximumFractionDigits: 0 }) : "0"}</span>
          </div>
        </div>
        
        <button
          className={cn(
            "w-full py-3 rounded-md font-medium",
            tradeType === "buy" 
              ? "bg-[var(--success)] text-white hover:bg-[var(--success)]/90"
              : "bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90"
          )}
        >
          {tradeType === "buy" ? `Buy ${displaySymbol}` : `Sell ${displaySymbol}`}
        </button>
        
        <div className="mt-4 text-xs text-[var(--secondary)]">
          <p>By submitting this order, you agree to our Terms of Service and Privacy Policy, and acknowledge the risks associated with trading tokenized securities on the Nairobi Securities Exchange.</p>
        </div>
      </div>
    </div>
  );
} 