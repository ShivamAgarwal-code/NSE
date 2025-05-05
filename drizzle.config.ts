import "dotenv/config"
import { defineConfig } from 'drizzle-kit';

const DB_URL = process.env.DB_URL!
console.log("DB_URL: ", DB_URL)
const NETWORK = process.env.NETWORK

export default defineConfig({
  out: './db/migrations',
  schema: './db/schema/index.ts',
  dialect: 'turso',
  dbCredentials: {
    url: NETWORK == "testnet" ? DB_URL : "./local-store/sqlite/sqlite.db",
    authToken: process.env.DB_TOKEN
  },
});