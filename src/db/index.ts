import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "./schema"
import { createClient } from "@libsql/client";
import { config } from 'dotenv';

// In production, environment variables should be set in the hosting platform
// For local development, dotenv will load from .env.local
if (process.env.NODE_ENV !== 'production') {
    config({ path: '.env.local' });
}

const DB_URL = process.env.DB_URL
const DB_TOKEN = process.env.DB_TOKEN

if (!DB_URL) {
    throw new Error("DB_URL environment variable is not set")
}

if (!DB_TOKEN) {
    throw new Error("DB_TOKEN environment variable is not set")
}

export const db = drizzle<typeof schema>({
    client: createClient({ 
        url: DB_URL,
        authToken: DB_TOKEN
    }),
    schema
}); 
