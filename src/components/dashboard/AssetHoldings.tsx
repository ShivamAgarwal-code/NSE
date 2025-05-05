import Image from "next/image";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetHolding {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  collateralValue: number;
}

interface AssetHoldingsProps {
  holdings: AssetHolding[];
}

export default function AssetHoldings({ holdings }: AssetHoldingsProps) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-xl font-medium">Your Holdings</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[var(--border-color)]/10">
              <th className="py-3 px-4 text-left text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Asset</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Quantity</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Avg. Price</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Current Price</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Value</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">P&L</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Collateral Value</th>
              <th className="py-3 px-4 text-right text-xs font-medium text-[var(--secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {holdings.map((asset) => (
              <tr key={asset.id} className="hover:bg-[var(--border-color)]/5">
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <Image
                        src={`https://storage.googleapis.com/public-stockdata/logos/${asset.symbol}.png`}
                        alt={`${asset.symbol} logo`}
                        fill
                        className="object-contain rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/40?text=" + asset.symbol;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-xs text-[var(--secondary)]">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  {asset.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  ${asset.averageBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  ${asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right font-medium">
                  ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  <div className={cn(
                    "inline-flex items-center gap-1 font-medium",
                    asset.unrealizedPL >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                  )}>
                    {asset.unrealizedPL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>${Math.abs(asset.unrealizedPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>({asset.unrealizedPLPercent.toFixed(2)}%)</span>
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  ${asset.collateralValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/asset/${asset.id}`} 
                      className="bracket-btn text-xs"
                    >
                      Trade
                    </Link>
                    <button className="bracket-btn text-xs">
                      Collateralize
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 