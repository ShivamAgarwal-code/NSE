"use client";

import { useState } from "react";
import { assets } from "@/data/marketData";
import { Search, Info, ArrowUpDown, Filter } from "lucide-react";
import AssetImage from "@/components/ui/AssetImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupplyForm from "@/components/lending/SupplyForm";
import WithdrawForm from "@/components/lending/WithdrawForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useAssetsProvidedLiquidityByAccount,
  useProvidedLiquidity,
  useTotalProvidedLiquidity,
} from "@/hooks/useProvidedLiquidity";
import { formatUSDC } from "@/lib/utils";
import { useAccount } from "wagmi";

interface Asset {
  id: string;
  name: string;
  symbol: string;
  tokenizedSymbol?: string;
  contractAddress?: string;
  price: number;
  apy: number;
  liquidity: number;
  collateralFactor: number;
  utilizationRate: number;
  logoUrl: string;
}

// Sample user data - in a real app this would come from an API
const userLendStats = {
  totalSupplied: 7420.25,
  totalEarned: 182.79,
  weightedApy: 2.47,
};

export default function LendPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("apy");
  const [activeTab, setActiveTab] = useState("supply");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const { address } = useAccount();

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

  // Get total provided liquidity
  const { data: totalProvidedLiquidity = 0 } = useTotalProvidedLiquidity();

  const {
    data: assetsProvidedLiquidityByAccount,
  } = useAssetsProvidedLiquidityByAccount(address as `0x${string}`);

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
      case "apy":
        return b.apy - a.apy;
      case "liquidity":
        return getTotalProvidedLiquidity(b.contractAddress || "") - getTotalProvidedLiquidity(a.contractAddress || "");
      default:
        return 0;
    }
  });

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Lending Markets</h1>

      {/* Supply Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--secondary)]">
              Total Supply
            </h3>
            <Info className="w-4 h-4 text-[var(--secondary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              {formatUSDC(totalProvidedLiquidity)} <span className="text-xs text-[var(--secondary)]">KES</span>
            </span>
          </div>
          <p className="text-xs text-[var(--secondary)] mt-1">
            Across various assets
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--secondary)]">
              Average APY
            </h3>
            <Info className="w-4 h-4 text-[var(--secondary)]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">
              {userLendStats.weightedApy.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-[var(--secondary)] mt-1">
            Weighted by supply amount
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--secondary)]"
            size={16}
          />
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
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </span>
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <div className={`absolute right-0 mt-1 w-48 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-10 ${isSortDropdownOpen ? 'block' : 'hidden'}`}>
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/10"
                  onClick={() => {
                    setSortBy("apy");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  APY
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/10"
                  onClick={() => {
                    setSortBy("liquidity");
                    setIsSortDropdownOpen(false);
                  }}
                >
                  Liquidity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assets to Supply */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="font-medium">Assets to Supply</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--card-bg-secondary)]">
                <th className="text-left text-sm font-medium text-[var(--secondary)] px-4 py-3">
                  Asset
                </th>
                <th className="text-right text-sm font-medium text-[var(--secondary)] px-4 py-3">
                  Liquidity(KES)
                </th>
                <th className="text-right text-sm font-medium text-[var(--secondary)] px-4 py-3">
                  Supply APY(%)
                </th>
                <th className="text-right text-sm font-medium text-[var(--secondary)] px-4 py-3">
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
                      <div className="text-[var(--success)]">
                        {asset.apy?.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="cursor-pointer px-4 py-1 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white">
                        Supply
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
        <h2 className="text-xl font-medium mb-4">About Supplying</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-2">Earn Interest by Supplying</h3>
            <p className="text-[var(--secondary)] mb-4">
              Supply your assets to Hedgehog Protocol to earn interest on your holdings. The interest rate varies by asset and is determined by market conditions.
            </p>
            <ul className="space-y-2 text-[var(--secondary)]">
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">1</span>
                <span>Supply your tokenized assets to the protocol</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">2</span>
                <span>Earn interest automatically over time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="min-w-5 min-h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs mt-0.5">3</span>
                <span>Withdraw your assets plus earned interest anytime</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Use Assets as Collateral</h3>
            <p className="text-[var(--secondary)] mb-4">
              When you supply assets, you can choose to use them as collateral, which allows you to borrow other assets. Each asset has a different collateral factor.
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Collateral Factor</span>
                  <span>How much you can borrow</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">
                  The collateral factor determines the maximum amount you can borrow using an asset as collateral. For example, a 75% collateral factor means you can borrow up to 75% of the value of your supplied asset.
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Utilization Rate</span>
                  <span>Market activity</span>
                </div>
                <p className="text-xs text-[var(--secondary)]">
                  The utilization rate shows how much of the supplied assets are currently being borrowed. Higher utilization generally leads to higher supply interest rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Supply/Withdraw Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedAsset
                ? `${selectedAsset.name} (${selectedAsset.symbol})`
                : "Supply/Withdraw"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Tabs
              defaultValue="supply"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <div className="border-b border-[var(--border-color)]">
                <TabsList className="w-full h-auto p-0">
                  <TabsTrigger
                    value="supply"
                    className={`flex-1 py-4 rounded-none text-sm font-medium ${
                      activeTab === "supply"
                        ? " border-b-2 border-[var(--primary)]"
                        : ""
                    }`}
                  >
                    Supply KES
                  </TabsTrigger>
                  <TabsTrigger
                    value="withdraw"
                    className={`flex-1 py-4 rounded-none text-sm font-medium ${
                      activeTab === "withdraw"
                        ? "border-b-2 border-[var(--danger)]"
                        : ""
                    }`}
                  >
                    Withdraw KES
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="py-4">
                <TabsContent value="supply" className="mt-0 pt-0">
                  <SupplyForm assetAddress={selectedAsset?.contractAddress} />
                </TabsContent>

                <TabsContent value="withdraw" className="mt-0 pt-0">
                  <WithdrawForm assetAddress={selectedAsset?.contractAddress} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
