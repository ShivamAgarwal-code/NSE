import { useBalance } from "wagmi";

interface SelectedAssetBorrowLimitProps {
  assetAddress: string;
  assetPrice: number;
  collateralFactor: number;
  userAddress: `0x${string}` | undefined;
}

export default function SelectedAssetBorrowLimit({ 
  assetAddress, 
  assetPrice, 
  collateralFactor,
  userAddress 
}: SelectedAssetBorrowLimitProps): number {
  const { data: balance } = useBalance({
    address: userAddress,
    token: assetAddress as `0x${string}`,
  });

  if (!balance?.value) return 0;

  return Number(balance.value) * assetPrice * collateralFactor;
} 