'use server';

import { db } from "@/db";
import { lendingReserves } from "@/db/schema";
import { desc } from "drizzle-orm";

export type LendingReserve = {
    token: string;
    asset: string;
    name: string;
    symbol: string;
    timestamp: number;
}

export async function getLendingReserves() {
    try {
        const reserves = await db
            .select()
            .from(lendingReserves)
            .orderBy(desc(lendingReserves.timestamp));

        return reserves as LendingReserve[];
    } catch (error) {
        console.error('Error fetching lending reserves:', error);
        return [];
    }
} 