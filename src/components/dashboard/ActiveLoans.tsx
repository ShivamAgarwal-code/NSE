import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Loan {
  id: string;
  symbol: string;
  amount: number;
  interestRate: number;
  startDate: string;
  collateral: string;
  healthFactor: number;
}

interface ActiveLoansProps {
  loans: Loan[];
}

export default function ActiveLoans({ loans }: ActiveLoansProps) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-xl font-medium">Active Loans</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[var(--border-color)]/10">
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Asset</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Amount</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Interest Rate</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Start Date</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Collateral</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Health Factor</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loans.map((loan) => {
              // Determine health status
              let healthStatus = "";
              if (loan.healthFactor >= 1.75) {
                healthStatus = "healthy";
              } else if (loan.healthFactor >= 1.5) {
                healthStatus = "warning";
              } else {
                healthStatus = "danger";
              }
              
              return (
                <tr key={loan.id} className="hover:bg-[var(--border-color)]/5">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-xs font-mono bg-[var(--border-color)]/20 px-2 py-1 rounded">{loan.id}</span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-medium">{loan.symbol}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right font-medium">
                    ${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    {loan.interestRate.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {new Date(loan.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {loan.collateral}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        healthStatus === "healthy" ? "bg-[var(--success)]" : 
                        healthStatus === "warning" ? "bg-[var(--warning)]" : 
                        "bg-[var(--danger)]"
                      )} />
                      <span className={cn(
                        healthStatus === "healthy" ? "text-[var(--success)]" : 
                        healthStatus === "warning" ? "text-[var(--warning)]" : 
                        "text-[var(--danger)]"
                      )}>
                        {loan.healthFactor.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="bracket-btn text-xs">
                        Repay
                      </button>
                      <button className="bracket-btn text-xs">
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {loans.length === 0 && (
        <div className="p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-[var(--secondary)] mx-auto mb-2" />
          <p className="text-[var(--secondary)]">You dont have any active loans.</p>
          <button className="bracket-btn mt-4">
            Get a Loan
          </button>
        </div>
      )}
    </div>
  );
} 