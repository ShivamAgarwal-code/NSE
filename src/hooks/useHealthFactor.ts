import { useTotalProvidedLiquidityByAccount } from "./useProvidedLiquidity";
import { useTotalLoanAmount } from "./useTotalLoanAmount";
import { useAccount } from "wagmi";

export function useHealthFactor() {
  const { address } = useAccount();
  
  const { data: totalCollateralValue } = useTotalProvidedLiquidityByAccount(
    address as `0x${string}`
  );
  
  const { data: totalBorrowedValue } = useTotalLoanAmount(
    address as `0x${string}`
  );

  // If either value is undefined or 0, return a safe default
  if (!totalCollateralValue || !totalBorrowedValue || totalBorrowedValue === 0) {
    return {
      healthFactor: 999, // Safe default
      isLoading: false,
    };
  }

  // Calculate health factor
  // Using a conservative collateral factor of 0.75 (75%)
  const COLLATERAL_FACTOR = 0.8;
  const healthFactor = (totalCollateralValue * COLLATERAL_FACTOR) / totalBorrowedValue;
  console.log("healthFactor", healthFactor);

  return {
    healthFactor,
    isLoading: false,
  };
} 