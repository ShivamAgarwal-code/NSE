import { Wallet, Briefcase, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioSummaryProps {
  totalBalance: string;
  totalEquity: string;
  totalDebt: string;
  collateralRatio: number;
  safetyBuffer: number;
}

export default function PortfolioSummary({
  totalBalance,
  totalEquity,
  totalDebt,
  collateralRatio,
  safetyBuffer,
}: PortfolioSummaryProps) {
  // Calculate health status
  const healthStatus = 
    collateralRatio > safetyBuffer + 0.15 
      ? "healthy" 
      : collateralRatio > safetyBuffer 
        ? "warning" 
        : "danger";
  
  return (
    <div className="card p-6">
      <h2 className="text-xl font-medium mb-6">Portfolio Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-[var(--border-color)]/10">
          <div className="flex items-center gap-2 text-[var(--secondary)] mb-2">
            <Wallet size={18} />
            <span className="text-sm">Total Balance</span>
          </div>
          <p className="text-2xl font-semibold">{totalBalance}</p>
          <p className="text-xs text-[var(--secondary)] mt-1">Equity + Debt</p>
        </div>
        
        <div className="p-4 rounded-md bg-[var(--border-color)]/10">
          <div className="flex items-center gap-2 text-[var(--secondary)] mb-2">
            <Briefcase size={18} />
            <span className="text-sm">Total Equity</span>
          </div>
          <p className="text-2xl font-semibold">{totalEquity}</p>
          <p className="text-xs text-[var(--secondary)] mt-1">Value of Assets</p>
        </div>
        
        <div className="p-4 rounded-md bg-[var(--border-color)]/10">
          <div className="flex items-center gap-2 text-[var(--secondary)] mb-2">
            <TrendingUp size={18} />
            <span className="text-sm">Total Debt</span>
          </div>
          <p className="text-2xl font-semibold">{totalDebt}</p>
          <p className="text-xs text-[var(--secondary)] mt-1">Outstanding Loans</p>
        </div>
        
        <div className="p-4 rounded-md bg-[var(--border-color)]/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className={cn(
              healthStatus === "healthy" ? "text-[var(--success)]" : 
              healthStatus === "warning" ? "text-[var(--warning)]" : 
              "text-[var(--danger)]"
            )} />
            <span className="text-sm">Health Factor</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold">{(collateralRatio * 100).toFixed(0)}%</p>
            <div className={cn(
              "text-xs px-2 py-1 rounded",
              healthStatus === "healthy" ? "bg-[var(--success)]/10 text-[var(--success)]" : 
              healthStatus === "warning" ? "bg-[var(--warning)]/10 text-[var(--warning)]" : 
              "bg-[var(--danger)]/10 text-[var(--danger)]"
            )}>
              {healthStatus === "healthy" ? "Safe" : 
                healthStatus === "warning" ? "Caution" : 
                "At Risk"}
            </div>
          </div>
          <p className="text-xs text-[var(--secondary)] mt-1">Min: {(safetyBuffer * 100).toFixed(0)}%</p>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[var(--secondary)]">Collateral Ratio</span>
          <span>{(collateralRatio * 100).toFixed(0)}%</span>
        </div>
        <div className="progress-bar mb-4">
          <div
            className={cn(
              "progress-bar-fill",
              healthStatus === "healthy" ? "bg-[var(--success)]" : 
              healthStatus === "warning" ? "bg-[var(--warning)]" : 
              "bg-[var(--danger)]"
            )}
            style={{ width: `${collateralRatio * 100}%` }}
          />
        </div>
        
        <div className="text-xs text-[var(--secondary)]">
          <p>Your collateral ratio represents the value of your assets relative to your outstanding loans. A higher ratio means your position is more secure against market fluctuations.</p>
          {healthStatus === "warning" && (
            <p className="mt-2 text-[var(--warning)]">Your position is approaching the minimum threshold. Consider adding more collateral or reducing your debt.</p>
          )}
          {healthStatus === "danger" && (
            <p className="mt-2 text-[var(--danger)]">Warning: Your position is at risk of liquidation. Take action immediately to increase your collateral or repay your loans.</p>
          )}
        </div>
      </div>
    </div>
  );
} 