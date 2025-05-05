'use server';

import { db } from "@/db";
import { loans, loanRepayment } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export type Loan = {
    id: string;
    account: string;
    collateralAsset: string;
    loanAmountUSDC: number;
    collateralAmount: number;
    liquidationPrice: number;
    repaymentAmount: number;
    timestamp: number;
}

export type LoanRepayment = {
    id: string;
    loanId: string;
    token: string;
    account: string;
    timestamp: number;
}

export async function getLoans(account?: string) {
    try {
        const query = db
            .select()
            .from(loans)
            .where(account ? eq(loans.account, account) : undefined)
            .orderBy(desc(loans.timestamp));

        const results = await query;
        return results as Loan[];
    } catch (error) {
        console.error('Error fetching loans:', error);
        return [];
    }
}

export async function getAllLoans() {
    try {
        const query = db
            .select()
            .from(loans)
            .orderBy(desc(loans.timestamp));

        const results = await query;
        return results as Loan[];
    } catch (error) {
        console.error('Error fetching loans:', error);
        return [];
    }
}

export async function getLoanRepaymentsByAccount(account: string) {
    try {
        const query = db
            .select()
            .from(loanRepayment)
            .where(eq(loanRepayment.account, account))
            .orderBy(desc(loanRepayment.timestamp));

        const results = await query;
        return results as LoanRepayment[];
    } catch (error) {
        console.error('Error fetching loan repayments by account:', error);
        return [];
    }
}

export async function getLoanRepayments(account?: string, loanId?: string) {
    try {
        const query = db
            .select()
            .from(loanRepayment)
            .where(
                account 
                    ? eq(loanRepayment.account, account)
                    : loanId 
                        ? eq(loanRepayment.loanId, loanId)
                        : undefined
            )
            .orderBy(desc(loanRepayment.timestamp));

        const results = await query;
        return results as LoanRepayment[];
    } catch (error) {
        console.error('Error fetching loan repayments:', error);
        return [];
    }
}

export async function getTotalLoanAmount(account: string) {
    try {
        // Get all repaid loan IDs for this account
        const repaidLoans = await db
            .select({ 
                loanId: loanRepayment.loanId,
                token: loanRepayment.token 
            })
            .from(loanRepayment)
            .where(eq(loanRepayment.account, account));

        // Create a map of token to repaid loan IDs
        const repaidLoansByToken = repaidLoans.reduce((acc, { loanId, token }) => {
            if (!acc[token]) {
                acc[token] = new Set();
            }
            acc[token].add(loanId);
            return acc;
        }, {} as Record<string, Set<string>>);

        // Get all active loans for this account
        const activeLoans = await db
            .select()
            .from(loans)
            .where(eq(loans.account, account));

        // Calculate total loan amount excluding repaid loans per token
        const totalAmount = activeLoans.reduce((sum, loan) => {
            // Check if this loan has been repaid for its token
            const repaidLoanIdsForToken = repaidLoansByToken[loan.collateralAsset];
            if (repaidLoanIdsForToken?.has(loan.id)) {
                return sum;
            }
            return sum + loan.loanAmountUSDC;
        }, 0);

        // Convert the amount from raw USDC (6 decimals) to human-readable format
        return totalAmount / Math.pow(10, 6);
    } catch (error) {
        console.error('Error fetching total loan amount:', error);
        return 0;
    }
}

export async function getTotalPlatformBorrowedAmount() {
    try {
        const query = db
            .select({
                total: sql<number>`sum(${loans.loanAmountUSDC})`
            })
            .from(loans);

        const result = await query;
        // Convert the amount from raw USDC (6 decimals) to human-readable format
        return result[0]?.total ? result[0].total / Math.pow(10, 6) : 0;
    } catch (error) {
        console.error('Error calculating total platform borrowed amount:', error);
        return 0;
    }
}
