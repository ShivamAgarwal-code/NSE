import { useQuery } from '@tanstack/react-query';
import { getAllLoans, getLoans, getTotalLoanAmount, getTotalPlatformBorrowedAmount } from '@/actions/loans';

export function useTotalLoanAmount(account: string) {
    return useQuery({
        queryKey: ['totalLoanAmount', account],
        queryFn: () => getTotalLoanAmount(account),
        enabled: !!account,
        refetchInterval: 2000,
    });
}

export function useTotalPlatformBorrowedAmount() {
    return useQuery({
        queryKey: ['totalPlatformBorrowedAmount'],
        queryFn: getTotalPlatformBorrowedAmount,
        refetchInterval: 2000,
    });
}

export function useLoans(account?: string) {
    return useQuery({
        queryKey: ['loans', account],
        queryFn: () => getLoans(account),
        enabled: !!account,
        refetchInterval: 2000,
    });
}

export function useAllLoans() {
    return useQuery({
        queryKey: ['allLoans'],
        queryFn: () => getAllLoans(),
    });
}