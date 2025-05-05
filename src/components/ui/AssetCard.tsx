import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import AssetImage from "./AssetImage";
import { useAssetPrice } from "@/hooks/usePrices";

interface AssetCardProps {
  id: string;
  name: string;
  symbol: string;
  tokenizedSymbol?: string;
  change: number;
  changePercent: number;
  apy: number;
  logoUrl: string;
  collateralFactor: number;
  utilizationRate: number;
  contractAddress: string;
}

export default function AssetCard({
  name,
  symbol,
  tokenizedSymbol,
  change,
  changePercent,
  apy,
  logoUrl,
  collateralFactor,
  contractAddress,
}: AssetCardProps) {
  const isPositive = change >= 0;
  const { data: assetPrice, isLoading: isLoadingAssetPrice } = useAssetPrice(contractAddress);

  return (
    <Link href={`/asset/${tokenizedSymbol}`}>
      <div className="card hover:shadow-sm transition-shadow cursor-pointer h-full p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <AssetImage logoUrl={logoUrl} symbol={symbol} size={8} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium">{symbol}</h3>
                {tokenizedSymbol && (
                  <span className="text-xs text-[var(--secondary)]">{tokenizedSymbol}</span>
                )}
              </div>
              <p className="text-xs text-[var(--secondary)]">{name}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--secondary)]" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--secondary)] mb-1">Price</p>
            <p className="font-medium">KES {isLoadingAssetPrice ? "0.00" : assetPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--secondary)] mb-1">24h Change</p>
            <div className={cn(
              "flex items-center gap-1 font-medium",
              isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{changePercent.toFixed(2)}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-[var(--secondary)] mb-1">APY</p>
            <p className="font-medium text-[var(--success)]">{apy.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--secondary)] mb-1">Collateral Factor</p>
            <p className="font-medium">{(collateralFactor * 100).toFixed(0)}%</p>
          </div>
        </div>
        
        {/* <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--secondary)]">Utilization</span>
            <span>{(utilizationRate * 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${utilizationRate * 100}%` }}
            />
          </div>
        </div> */}
      </div>
    </Link>
  );
} 