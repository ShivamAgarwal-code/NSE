import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface PriceChartProps {
  data: {
    "1D": { time: string; price: number }[];
    "1W": { time: string; price: number }[];
    "1M": { time: string; price: number }[];
    "3M": { time: string; price: number }[];
    "1Y": { time: string; price: number }[];
  };
  color?: string;
}

type TimeFrame = "1D" | "1W" | "1M" | "3M" | "1Y";

export default function PriceChart({ data, color = "#3b82f6" }: PriceChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D");
  const chartData = data[timeFrame];
  
  // Calculate domain padding for the chart
  const prices = chartData.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1; // 10% padding
  
  const timeFrames: TimeFrame[] = ["1D", "1W", "1M", "3M", "1Y"];
  
  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Price Chart</h3>
          <div className="flex items-center border border-[var(--border-color)] rounded-md divide-x divide-[var(--border-color)]">
            {timeFrames.map((tf) => (
              <button
                key={tf}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  timeFrame === tf 
                    ? "bg-[var(--primary)] text-white" 
                    : "hover:bg-[var(--border-color)]/20"
                )}
                onClick={() => setTimeFrame(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                stroke="var(--secondary)"
                tickLine={false}
              />
              <YAxis 
                domain={[minPrice - padding, maxPrice + padding]}
                tick={{ fontSize: 12 }}
                stroke="var(--secondary)"
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: 'var(--card-bg)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 