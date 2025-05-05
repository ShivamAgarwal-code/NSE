'use server';

import { db } from "@/db";
import { prices } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getAssetPrice(token: string) {
  try {
    console.log('Fetching price for token:', token);
    
    const latestPrice = await db.query.prices.findFirst({
      where: (prices, { eq }) => eq(prices.token, token),
      orderBy: [desc(prices.timestamp)]
    });

    console.log('Latest price from DB:', latestPrice);
    return latestPrice?.price || null;
  } catch (error) {
    console.error('Error fetching asset price:', error);
    return null;
  }
}

export async function getAllAssetPrices() {
  try {
    console.log('Fetching all asset prices');
    
    // Get the latest price for each token using a subquery
    const latestPrices = await db.query.prices.findMany({
      orderBy: [desc(prices.timestamp)]
    });

    console.log('All prices from DB:', latestPrices);

    // Group by token and get the latest price for each
    const priceMap = latestPrices.reduce((acc: Record<string, number>, price) => {
      // Only set the price if we haven't seen this token before
      if (!acc[price.token]) {
        acc[price.token] = price.price;
      }
      return acc;
    }, {});

    console.log('Processed price map:', priceMap);
    return priceMap;
  } catch (error) {
    console.error('Error fetching all asset prices:', error);
    return {};
  }
} 