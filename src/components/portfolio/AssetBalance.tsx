import { useBalance } from "wagmi";
import AssetImage from "@/components/ui/AssetImage";
import { formatUSDC } from "@/lib/utils";
import { useAssetPrice } from "@/hooks/usePrices";

interface AssetBalanceProps {
  asset: {
    id: string;
    contractAddress: string;
    logoUrl: string;
    symbol: string;
    tokenizedSymbol?: string;
    price: number;
  };
  address: `0x${string}`;
}

export const AssetBalance = ({ asset, address }: AssetBalanceProps) => {
  const { data: balance } = useBalance({
    address: address,
    token: asset.contractAddress as `0x${string}`,
  });

  const { data: price, isLoading: isPriceLoading } = useAssetPrice(asset.contractAddress as `0x${string}`);
  
  if (!balance || balance.value === BigInt(0)) return null;

  const formatAssetBalance = (balance: bigint) => {
    return Number(balance).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="p-4 bg-[var(--border-color)]/10 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AssetImage
            logoUrl={asset.logoUrl}
            symbol={asset.symbol}
            size={10}
          />
          <span className="font-normal">
            {asset.tokenizedSymbol}
          </span>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">
            {formatAssetBalance(balance.value)}
          </div>
         
        </div>
      </div>
      <div className="flex justify-between items-center">
      <p className="text-xs text-[var(--secondary)]">
        {isPriceLoading ? "Loading..." : `Price: ${formatUSDC(Number(price))}`}
      </p>
      <div className="text-xs text-[var(--success)]">
            
            KES {formatUSDC(Number(balance.value) * (price ?? 0))}
          </div>
      </div>
     
    </div>
  );
}; 