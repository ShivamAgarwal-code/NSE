import { useQuery } from '@tanstack/react-query';
import { getAssetPrice, getAllAssetPrices } from '@/actions/prices';

export function useAssetPrice(token: string) {
//   console.log('useAssetPrice hook called with token:', token);
  
  return useQuery({
    queryKey: ['assetPrice', token],
    queryFn: async () => {
    //   console.log('Fetching price for token:', token);
      const price = await getAssetPrice(token);
    //   console.log('Received price:', price);
      return price;
    },
    //refetchInterval: 5000, // Refetch every 5 seconds
   // staleTime: 4000, // Consider data stale after 4 seconds
  });
}

export function useAllAssetPrices() {
//   console.log('useAllAssetPrices hook called');
  
  return useQuery({
    queryKey: ['allAssetPrices'],
    queryFn: async () => {
    //   console.log('Fetching all asset prices');
      const prices = await getAllAssetPrices();
    //   console.log('Received all prices:', prices);
      return prices;
    },
    //refetchInterval: 5000, // Refetch every 5 seconds
    //staleTime: 4000, // Consider data stale after 4 seconds
  });
} 