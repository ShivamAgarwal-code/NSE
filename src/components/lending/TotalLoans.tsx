import { Info } from "lucide-react";
import { useTotalLoanAmount } from "@/hooks/useTotalLoanAmount";
import { formatUSDC } from "@/lib/utils";

interface TotalLoansProps {
  account: string;
}

export default function TotalLoans({ account }: TotalLoansProps) {
  const { data: totalLoanAmount, isLoading } = useTotalLoanAmount(account);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--secondary)]">Total Loans</h3>
        <Info className="w-4 h-4 text-[var(--secondary)]" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">
          {isLoading ? (
            "0.00"
          ) : (
            formatUSDC(totalLoanAmount || 0)
          )}{" "}
          <span className="text-xs text-[var(--secondary)]">KES</span>
        </span>
      </div>
      <p className="text-xs text-[var(--secondary)] mt-1">
        Across all assets
      </p>
    </div>
  );
} 