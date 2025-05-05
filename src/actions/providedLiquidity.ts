"use server";

import { db } from "@/db";
import { providedLiquidity } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loans } from "@/db/schema";
import { loanRepayment } from "@/db/schema";

const USDC_DECIMALS = 6;

export async function getProvidedLiquidity(assetTokenAddress: string) {
  try {
    const liquidity = await db
      .select()
      .from(providedLiquidity)
      .where(eq(providedLiquidity.asset, assetTokenAddress));

    // Convert the amount from raw USDC (6 decimals) to human-readable format
    return liquidity.map(item => ({
      ...item,
      amount: item.amount / Math.pow(10, USDC_DECIMALS)
    }));
  } catch (error) {
    console.error("Error fetching provided liquidity:", error);
    throw new Error("Failed to fetch provided liquidity");
  }
}

export async function getTotalProvidedLiquidity() {
  try {
    const allLiquidity = await db
      .select()
      .from(providedLiquidity);

    // Sum all amounts and convert from raw USDC (6 decimals) to human-readable format
    const totalAmount = allLiquidity.reduce((sum, item) => sum + item.amount, 0);
    return totalAmount / Math.pow(10, USDC_DECIMALS);
  } catch (error) {
    console.error("Error fetching total provided liquidity:", error);
    throw new Error("Failed to fetch total provided liquidity");
  }
}

// get total provided liquidity by account
export async function getTotalProvidedLiquidityByAccount(account: string) {
  try {
    const allLiquidity = await db
      .select()
      .from(providedLiquidity)
      .where(eq(providedLiquidity.account, account));


    //Sum all amounts and convert from raw USDC (6 decimals) to human-readable format
    const totalAmount = allLiquidity.reduce((sum, item) => sum + item.amount, 0);
    return totalAmount / Math.pow(10, USDC_DECIMALS);
  } catch (error) {
    console.error("Error fetching total provided liquidity by account:", error);
    throw new Error("Failed to fetch total provided liquidity by account");
  }
}

export async function getAssetsProvidedLiquidityByAccount(account: string) {
  try {
    // Get all provided liquidity for the account
    const allLiquidity = await db
      .select()
      .from(providedLiquidity)
      .where(eq(providedLiquidity.account, account));

    // Get all active loans for the account
    const activeLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.account, account));

    // Get all repaid loan IDs
    const repaidLoanIds = await db
      .select({ loanId: loanRepayment.loanId })
      .from(loanRepayment)
      .where(eq(loanRepayment.account, account));

    const repaidLoanIdSet = new Set(repaidLoanIds.map(r => r.loanId));

    // Filter out repaid loans
    const activeLoansWithoutRepaid = activeLoans.filter(loan => !repaidLoanIdSet.has(loan.id));

    // Group loans by collateral asset
    const loansByAsset = activeLoansWithoutRepaid.reduce((acc, loan) => {
      if (!acc[loan.collateralAsset]) {
        acc[loan.collateralAsset] = 0;
      }
      acc[loan.collateralAsset] += loan.loanAmountUSDC;
      return acc;
    }, {} as Record<string, number>);

    // Add borrowed amount to each liquidity item
    return allLiquidity.map(item => ({
      ...item,
      borrowedAmount: loansByAsset[item.asset] || 0
    }));

  } catch (error) {
    console.error("Error fetching total provided liquidity by account:", error);
    throw new Error("Failed to fetch total provided liquidity by account");
  }
}



export async function getMarketsProvidedLiquidityByAccount(account: string) {
    try {
      const allLiquidity = await db
        .select()
        .from(providedLiquidity)
        .where(eq(providedLiquidity.account, account));

        // const markets = allLiquidity.map(item => item.asset);
        // return markets;
        return allLiquidity;
  
     
    } catch (error) {
      console.error("Error fetching total provided liquidity by account:", error);
      throw new Error("Failed to fetch total provided liquidity by account");
    }
  }