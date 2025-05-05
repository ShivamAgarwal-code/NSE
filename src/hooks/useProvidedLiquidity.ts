import { useQuery } from "@tanstack/react-query";
import { getAssetsProvidedLiquidityByAccount, getMarketsProvidedLiquidityByAccount, getProvidedLiquidity, getTotalProvidedLiquidity, getTotalProvidedLiquidityByAccount } from "@/actions/providedLiquidity";

export function useProvidedLiquidity(assetTokenAddresses: string[]) {
  return useQuery({
    queryKey: ["providedLiquidity", assetTokenAddresses],
    queryFn: async () => {
      const results = await Promise.all(
        assetTokenAddresses.map(address => getProvidedLiquidity(address))
      );
      return Object.fromEntries(
        assetTokenAddresses.map((address, index) => [address, results[index]])
      );
    },
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: assetTokenAddresses.length > 0, // Only run query if there are addresses
  });
}

export function useTotalProvidedLiquidity() {
  return useQuery({
    queryKey: ["totalProvidedLiquidity"],
    queryFn: getTotalProvidedLiquidity,
   refetchInterval: 2000, // Poll every 2 seconds
   staleTime: 0, // 5 minutes
  });
} 

export function useTotalProvidedLiquidityByAccount(account: `0x${string}`) {
  return useQuery({
    queryKey: ["totalProvidedLiquidityByAccount", account],
    queryFn: () => getTotalProvidedLiquidityByAccount(account),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!account,
    staleTime: 0, // 5 minutes
  });
}

export function useAssetsProvidedLiquidityByAccount(account: `0x${string}`) {
  return useQuery({
    queryKey: ["assetsProvidedLiquidityByAccount", account],
    queryFn: () => getAssetsProvidedLiquidityByAccount(account),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!account,
    staleTime: 0, // 5 minutes
  });
}

export function useMarketsProvidedLiquidityByAccount(account: `0x${string}`) {
    return useQuery({
        queryKey: ["marketsProvidedLiquidityByAccount", account],
        queryFn: () => getMarketsProvidedLiquidityByAccount(account),
        refetchInterval: 2000, // Poll every 2 seconds
        enabled: !!account,
        staleTime: 0, // 5 minutes
    });
}
