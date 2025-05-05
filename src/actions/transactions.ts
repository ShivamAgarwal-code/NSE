'use server';

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export type Transaction = {
    hash: string;
    account: string;
    token: string;
    amount: number;
    type: string;
    timestamp: number;
}

export async function getTransactions(token?: string) {
    try {
        const query = db
            .select()
            .from(transactions)
            .where(token ? eq(transactions.token, token) : undefined)
            .orderBy(desc(transactions.timestamp));

        const results = await query;
        return results as Transaction[];
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

