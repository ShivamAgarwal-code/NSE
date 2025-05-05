import { useQuery } from '@tanstack/react-query';
import { getTransactions, type Transaction } from '@/actions/transactions';

export function useTransactions(token?: string) {
    return useQuery<Transaction[]>({
        queryKey: ['transactions', token],
        queryFn: () => getTransactions(token),
       refetchInterval: 3000, // Poll every 3 seconds
        staleTime: 0, // Consider data stale after 2 seconds
    });
} 