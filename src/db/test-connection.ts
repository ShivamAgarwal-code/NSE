import { db } from "./index";
import { 
    assets, 
    kyc, 
    transactions, 
    prices, 
    lendingReserves, 
    loans, 
    liquidations, 
    loanRepayment, 
    providedLiquidity, 
    withdrawnLiquidity, 
    realwordAssetTimeseries,
   
} from "./schema";
import { SQLiteTable } from "drizzle-orm/sqlite-core";

async function testTableExists(table: SQLiteTable) {
    try {
        // Try to get the first row (if any)
        await db.select().from(table).limit(1);
        return true;
    } catch {
        return false;
    }
}

async function testAllTables() {
    try {
        console.log("Testing database connection and tables...\n");

        const tables = [
            { name: "assets", table: assets },
            { name: "kyc", table: kyc },
            { name: "transactions", table: transactions },
            { name: "prices", table: prices },
            { name: "lendingReserves", table: lendingReserves },
            { name: "loans", table: loans },
            { name: "liquidations", table: liquidations },
            { name: "loanRepayment", table: loanRepayment },
            { name: "providedLiquidity", table: providedLiquidity },
            { name: "withdrawnLiquidity", table: withdrawnLiquidity },
            { name: "realwordAssetTimeseries", table: realwordAssetTimeseries },
        ];

        for (const { name, table } of tables) {
            const exists = await testTableExists(table);
            const data = await db.select().from(table);
            
            console.log(`${name} table:`);
            console.log(`- Exists: ${exists ? "Yes" : "No"}`);
            console.log(`- Records: ${data.length}`);
            console.log(`- Sample:`, data[0] || "No records");
            console.log("");
        }

        console.log("Database connection and all tables tested successfully!");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
}

// Run the test
testAllTables(); 