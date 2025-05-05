import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";



export const assets = sqliteTable("assets", {
    token: text("token").unique().primaryKey().notNull(),
    name: text("name").notNull().unique().notNull(),
    symbol: text("symbol").notNull().unique().notNull(), 
    timestamp: real("timestamp").notNull()
})

export const kyc = sqliteTable("kyc", {
    account: text("account").unique().primaryKey().notNull(),
    token: text("token").references(()=> assets.token).notNull(),
})

export const transactions = sqliteTable("transactions", {
    hash: text("hash").unique().primaryKey().notNull(),
    account: text("account").notNull(),
    token: text("token").notNull(),
    amount: real("amount").notNull(),
    type: text("type").notNull(),
    timestamp: real("timestamp").notNull()
})

export const prices = sqliteTable("prices",{
    id: text("id").unique().primaryKey().notNull(),
    token: text("token").references(()=> assets.token).notNull(),
    price: real("price").notNull(),
    timestamp: real("timestamp").notNull()
})

export const lendingReserves = sqliteTable("lendingReserves", {
    token: text("token").unique().primaryKey().notNull(),
    asset: text("asset").notNull().references(()=> assets.token),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    timestamp: real("timestamp").notNull()
})

export const loans = sqliteTable("loans", {
    id: text("id").unique().primaryKey().notNull(),
    account: text("account").notNull(),
    collateralAsset: text("collateralAsset").notNull().references(()=> assets.token),
    loanAmountUSDC: real("loanAmount").notNull(),
    collateralAmount: real("collateralAmount").notNull(),
    liquidationPrice: real("liquidationPrice").notNull(),
    repaymentAmount: real("repaymentAmount").notNull(),
    timestamp: real("timestamp").notNull()
})

export const liquidations = sqliteTable("liquidations", {
    id: text("id").unique().primaryKey().notNull(),
    loanId: text("loanId").notNull().references(()=> loans.id),
    account: text("account").notNull(),
    timestamp: real("timestamp").notNull()
})

export const loanRepayment = sqliteTable("loanRepayment", {
    id: text("id").unique().primaryKey().notNull(),
    loanId: text("loanId").notNull().references(()=> loans.id),
    token: text("token").notNull().references(()=> assets.token),
    account: text("account").notNull(),
    timestamp: real("timestamp").notNull()
})

export const providedLiquidity = sqliteTable("providedLiquidity", {
    id: text("id").unique().primaryKey().notNull(),
    asset: text("asset").notNull().references(()=> assets.token),
    amount: real("amount").notNull(),
    account: text("account").notNull(),
    timestamp: real("timestamp").notNull()
})

export const withdrawnLiquidity = sqliteTable("withdrawnLiquidity", {
    id: text("id").unique().primaryKey().notNull(),
    asset: text("asset").notNull().references(()=> assets.token),
    amount: real("amount").notNull(),
    account: text("account").notNull(),
    timestamp: real("timestamp").notNull()
})

export const realwordAssetTimeseries = sqliteTable("realwordAssetTimeseries", {
    id: text("id").unique().primaryKey().notNull(),
    open: real("open").notNull(),
    close: real("close").notNull(),
    high: real("high").notNull(),
    low: real("low").notNull(),
    net: real("net").notNull(),
    gross: real("gross").notNull(),
    timestamp: real("timestamp").notNull(),
    asset: text("asset").notNull()
})
