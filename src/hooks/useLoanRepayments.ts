import { useQuery } from "@tanstack/react-query";
import { getLoanRepayments, getLoanRepaymentsByAccount, type LoanRepayment } from "@/actions/loans";

export function useLoanRepaymentsByAccount(account: string) {
  return useQuery<LoanRepayment[]>({
    queryKey: ["loanRepayments", "account", account],
    queryFn: () => getLoanRepaymentsByAccount(account),
    enabled: !!account,
    refetchInterval: 2000,
  });
}

export function useLoanRepayments(account?: string, loanId?: string) {
  return useQuery<LoanRepayment[]>({
    queryKey: ["loanRepayments", account, loanId],
    queryFn: () => getLoanRepayments(account, loanId),
    enabled: !!account || !!loanId,
    refetchInterval: 2000,
  });
} 