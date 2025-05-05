import { useBalance } from "wagmi";
import { formatUSDC } from "@/lib/utils";
import { useAssetPrice } from "@/hooks/usePrices";

interface AssetBorrowLimitProps {
  assetAddress: string;
  collateralFactor: number;
  userAddress: `0x${string}` | undefined;
}

export default function AssetBorrowLimit({ 
  assetAddress, 
  collateralFactor,
  userAddress 
}: AssetBorrowLimitProps) {
  const { data: balance } = useBalance({
    address: userAddress,
    token: assetAddress as `0x${string}`,
  });

  const { data: price, isLoading: isPriceLoading } = useAssetPrice(assetAddress as `0x${string}`);

  const assetPrice = Number(price);
  if (!balance?.value) {
    return (
      <span className="text-[var(--secondary)]">
        0 <span className="text-xs text-[var(--secondary)]">KES</span>
      </span>
    );
  }

  if (isPriceLoading) {
    return (
      <span className="text-[var(--secondary)]">
        0 <span className="text-xs text-[var(--secondary)]">KES</span>
      </span>
    );
  }
  const borrowLimit = Number(balance.value) * assetPrice * collateralFactor;

  return (
    <span className="">
      {formatUSDC(borrowLimit)}
    </span>
  );
} 