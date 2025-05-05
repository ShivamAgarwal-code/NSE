"use client";

import { useState } from "react";
import { assets } from "@/data/marketData";
import { Search, Info, ArrowUpDown, Filter, ArrowRight } from "lucide-react";
import AssetImage from "@/components/ui/AssetImage";
import { formatUSDC } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BorrowForm from "@/components/lending/BorrowForm";
import RepayForm from "@/components/lending/RepayForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAssetsProvidedLiquidityByAccount, useProvidedLiquidity } from "@/hooks/useProvidedLiquidity";
import { useAccount } from "wagmi";
import AssetBorrowLimit from "@/components/lending/AssetBorrowLimit";
import { useRouter } from "next/navigation";
import { useTotalPlatformBorrowedAmount } from "@/hooks/useTotalLoanAmount";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  tokenizedSymbol?: string;
  price: number;
  borrowApy: number;
  availableToBorrow: number;
  logoUrl: string;
  change: number;
  contractAddress: string;
  collateralFactor: number;
}

export default function BorrowPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("liquidity");
  const [activeTab, setActiveTab] = useState("borrow");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const { address } = useAccount();
  const router = useRouter();
  
  const {
    data: assetsProvidedLiquidityByAccount,
  } = useAssetsProvidedLiquidityByAccount(address as `0x${string}`);

  // Calculate total borrow limit from all assets
  const totalBorrowLimit = assetsProvidedLiquidityByAccount?.reduce((total, item) => {
    const asset = assets.find(a => a.contractAddress === item.asset);
    if (!asset) return total;
    const userProvidedAmount = Number(item.amount) / 1e6;
    const borrowedAmount = Number(item.borrowedAmount) / 1e6;
    const availableBorrowLimit = (userProvidedAmount * (asset.collateralFactor || 0)) - borrowedAmount;
    return total + Math.max(0, availableBorrowLimit);
  }, 0) || 0;

  // Sample user data - in a real app this would come from an API
  const userBorrowStats = {
    borrowLimit: totalBorrowLimit,
    totalBorrowed: assetsProvidedLiquidityByAccount?.reduce((total, item) => total + (Number(item.borrowedAmount) / 1e6), 0) || 0,
    borrowLimitUsed: totalBorrowLimit > 0 ? (assetsProvidedLiquidityByAccount?.reduce((total, item) => total + (Number(item.borrowedAmount) / 1e6), 0) || 0) / totalBorrowLimit : 0,
    netAPY: 1.8
  };

  // console.log(assetsProvidedLiquidityByAccount);

  // Filter assets based on search term
  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all asset addresses
  const assetAddresses = filteredAssets
    .map((asset) => asset.contractAddress)
    .filter((address): address is string => !!address);

  // Fetch provided liquidity for all assets
  const { data: providedLiquidityData } = useProvidedLiquidity(assetAddresses);

  // Helper function to get total provided liquidity
  const getTotalProvidedLiquidity = (assetTokenAddress: string) => {
    if (!providedLiquidityData?.[assetTokenAddress]) return 0;
    return providedLiquidityData[assetTokenAddress].reduce(
      (sum, item) => sum + item.amount,
      0
    );
  };

  // Sort assets based on selected criteria
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "liquidity":
        return getTotalProvidedLiquidity(b.contractAddress || "") - getTotalProvidedLiquidity(a.contractAddress || "");
      case "borrowApy":
        return (b.borrowApy || 0) - (a.borrowApy || 0);
      case "borrowLimit":
        const aLimit = Number(assetsProvidedLiquidityByAccount?.find(item => item.asset === a.contractAddress)?.amount || 0) / 1e6 * (a.collateralFactor || 0);
        const bLimit = Number(assetsProvidedLiquidityByAccount?.find(item => item.asset === b.contractAddress)?.amount || 0) / 1e6 * (b.collateralFactor || 0);
        return bLimit - aLimit;
      default:
        return 0;
    }
  });

  const { data: totalPlatformBorrowedAmount } = useTotalPlatformBorrowedAmount();

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Borrow Markets</h1>
      
      {/* Borrow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
        
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--secondary)]">Total Borrowed</h3>
            <Info className="w-4 h-4 text-[var(--secondary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              {formatUSDC(totalPlatformBorrowedAmount || 0)} <span className="text-xs text-[var(--secondary)]">KES</span>
            </span>
          </div>
          <p className="text-xs text-[var(--secondary)] mt-1">Across all assets</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--secondary)]">Net APY</h3>
            <Info className="w-4 h-4 text-[var(--secondary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{userBorrowStats.netAPY.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-[var(--secondary)] mt-1">Supply APY - Borrow APY</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--secondary)]" size={16} />
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 rounded-md border border-[var(--border-color)] hover:bg-[var(--border-color)]/10">
            <Filter className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <button 
              className="flex items-center gap-1 p-2 rounded-md border border-[var(--border-color)] hover:bg-[var(--border-color)]/10"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <span>
                Sort: {sortBy === "liquidity" ? "Liquidity" : sortBy === "borrowApy" ? "Borrow APY" : "Borrow Limit"}
              </span>
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <div className={`absolute right-0 mt-1 w-48 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-10 ${isSortDropdownOpen ? 'block' : 'hidden'}`}>
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/10"
                  onClick={() => {
                    setSortBy("liquidity");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  Liquidity
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/10"
                  onClick={() => {
                    setSortBy("borrowApy");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  Borrow APY
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/10"
                  onClick={() => {
                    setSortBy("borrowLimit");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  Borrow Limit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Assets to Borrow */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
          <h2 className="font-medium">Assets to Borrow</h2>
          <button onClick={() => router.push("/portfolio")} className="flex items-center gap-2 text-sm hover:text-[var(--primary)] hover:underline py-1">
            View my positions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
     
         <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--card-bg-secondary)]">
                <th className="text-left text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Asset
                </th>
                <th className="text-right text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Liquidity(KES)
                </th>
                <th className="text-right text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Borrow Limit(KES)
                </th>
                <th className="text-right text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Borrow APY(%)
                </th>
                <th className="text-right text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Collateral Factor(%)
                </th>
                <th className="text-right text-xs font-medium text-[var(--secondary)] px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAssets.map((asset) => {
                const providedLiquidity = getTotalProvidedLiquidity(
                  asset.contractAddress || ""
                );
                // Get user's provided liquidity for this asset
                const userProvidedLiquidity = assetsProvidedLiquidityByAccount?.find(
                  (item) => item.asset === asset.contractAddress
                );
                const userProvidedAmount = userProvidedLiquidity 
                  ? Number(userProvidedLiquidity.amount) / 1e6 
                  : 0;

                return (
                  <tr
                    key={asset.id}
                    className="border-b border-[var(--border-color)] last:border-0 cursor-pointer hover:bg-[var(--border-color)]/5"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <AssetImage
                          logoUrl={asset.logoUrl}
                          symbol={asset.symbol}
                          size={8}
                        />
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-[var(--secondary)]">
                            {asset.symbol}
                            {asset.tokenizedSymbol && (
                              <span className="ml-1 text-[11px] text-[var(--secondary)]/70">
                                {asset.tokenizedSymbol}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {providedLiquidity > 0 ? (
                        <span className="ml-2">
                          {formatUSDC(providedLiquidity)} 
                        </span>
                      ) : (
                        <span className="ml-2 text-[var(--secondary)]">
                          No liquidity
                        </span>
                      )}
                      <div className="text-xs text-[var(--secondary)]">
                        {userProvidedAmount > 0 && (
                          <span className="ml-2 text-[var(--success)]">
                            {formatUSDC(userProvidedAmount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <AssetBorrowLimit
                        assetAddress={asset.contractAddress}
                        collateralFactor={asset.collateralFactor || 0}
                        userAddress={address}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-[var(--success)]">
                        {asset.apy?.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div>
                        {asset.collateralFactor
                          ? (asset.collateralFactor * 100).toFixed(0) + "%"
                          : "0%"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="cursor-pointer px-4 py-1 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-dark) text-white">
                        Borrow
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Information Section */}
      {/* <div className="card p-6">
        <h2 className="text-xl font-medium mb-4">About Borrowing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-2">How Borrowing Works</h3>
            <p className="text-[var(--secondary)] mb-4">
              Hedgehog Protocol allows you to borrow assets against your supplied collateral. Your borrow limit is determined by the value of your supplied assets and their collateral factors.
            </p>
            <ul className="space-y-2 text-[var(--secondary)]">
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">1</span>
                <span>Supply assets as collateral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">2</span>
                <span>Borrow up to your borrow limit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">3</span>
                <span>Maintain a safe health factor to avoid liquidation</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Risk Management</h3>
            <p className="text-[var(--secondary)] mb-4">
              When borrowing, it&apos;s important to maintain a healthy position to avoid liquidation. The following factors affect your borrowing risk:
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Health Factor</span>
                  <span>Your buffer before liquidation</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">
                  Keep your health factor above 1.0 to avoid liquidation. The higher, the safer.
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Borrow Limit</span>
                  <span>How much you can borrow</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">
                  Your borrow limit is determined by the value of your collateral and each asset&apos;s collateral factor.
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Liquidation</span>
                  <span>When your position becomes risky</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">
                  If your health factor falls below 1.0, your collateral may be liquidated to repay your debt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Borrow/Repay Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedAsset ? `${selectedAsset.name} (${selectedAsset.symbol})` : "Borrow/Repay"}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <Tabs defaultValue="borrow" value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-[var(--border-color)]">
                <TabsList className="w-full h-auto p-0">
                  <TabsTrigger 
                    value="borrow" 
                    className={`flex-1 py-4 rounded-none text-sm font-medium ${
                      activeTab === "borrow" ? "border-b-2 border-[var(--primary)]" : ""
                    }`}
                  >
                    Borrow 
                  </TabsTrigger>
                  <TabsTrigger 
                    value="repay" 
                    className={`flex-1 py-4 rounded-none text-sm font-medium ${
                      activeTab === "repay" ? "border-b-2 border-[var(--danger)]" : ""
                    }`}
                  >
                    Repay 
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="py-4">
                <TabsContent value="borrow" className="mt-0 pt-0">
                  {selectedAsset && (
                    <BorrowForm 
                     
                      assetAddress={selectedAsset.contractAddress}
                      assetName={selectedAsset.name}
                      collateralFactor={selectedAsset.collateralFactor || 0}
                      userAddress={address}
                      tokenizedSymbol={selectedAsset.tokenizedSymbol}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="repay" className="mt-0 pt-0">
                  <RepayForm 
                    outstandingDebt={userBorrowStats.totalBorrowed}
                    assetAddress={selectedAsset?.contractAddress}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 