import { useBalance } from "wagmi";
import { formatUSDC } from "@/lib/utils";
import { useAssetPrice } from "@/hooks/usePrices";
import { useState, useCallback, useMemo, useEffect } from "react";

interface Asset {
  contractAddress: string;
  collateralFactor: number;
}

interface TotalBorrowLimitProps {
  assets: Asset[];
  userAddress: `0x${string}` | undefined;
}

// Component to calculate borrow limit for a single asset
function AssetBorrowLimit({
  asset,
  userAddress,
  setLimit,
}: {
  asset: Asset;
  userAddress: `0x${string}` | undefined;
  setLimit: (address: string, limit: number) => void;
}) {
  const { data: balance } = useBalance({
    address: userAddress,
    token: asset.contractAddress as `0x${string}`,
  });
  const { data: price } = useAssetPrice(asset.contractAddress as `0x${string}`);

  useEffect(() => {
    if (balance && price) {
      const limit = Number(balance.value) * Number(price) * asset.collateralFactor;
      setLimit(asset.contractAddress, limit);
    }
  }, [balance, price, asset, setLimit]);

  // Return null since we don’t need to render anything
  return null;
}

export default function TotalBorrowLimit({
  assets,
  userAddress,
}: TotalBorrowLimitProps) {
  // State to store borrow limits, keyed by asset contractAddress
  const [limits, setLimits] = useState<Record<string, number>>({});

  // Callback to update the limits state
  const setAssetLimit = useCallback((address: string, limit: number) => {
    setLimits((prev) => ({ ...prev, [address]: limit }));
  }, []);

  // Compute total borrow limit for current assets
  const totalBorrowLimit = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const limit = limits[asset.contractAddress] || 0;
      return sum + limit;
    }, 0);
  }, [assets, limits]);

  return (
    <>
      {assets.map((asset) => (
        <AssetBorrowLimit
          key={asset.contractAddress}
          asset={asset}
          userAddress={userAddress}
          setLimit={setAssetLimit}
        />
      ))}
      <span className="text-2xl font-semibold">
        {formatUSDC(totalBorrowLimit)}{" "}
        <span className="text-xs text-[var(--secondary)]">KES</span>
      </span>
    </>
  );
}