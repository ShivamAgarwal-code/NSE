import { useQuery } from '@tanstack/react-query';
import { getLendingReserves, type LendingReserve } from '@/actions/lendingReserves';

export function useLendingReserves() {
    return useQuery<LendingReserve[]>({
        queryKey: ['lendingReserves'],
        queryFn: () => getLendingReserves(),
        refetchInterval: 3000, // Poll every 3 seconds
        staleTime: 0, // Consider data stale immediately
    });
} 