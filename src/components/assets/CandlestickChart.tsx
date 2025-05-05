import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarProps } from "recharts";

interface CandlestickDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandlestickDataPoint[];
}

interface CandlestickProps extends BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  open: number;
  close: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CandlestickDataPoint;
  }>;
}

// Custom renderer for candlestick elements
const renderCandlestick = (props: unknown) => {
  const { x, y, width, height, open, close } = props as CandlestickProps;
  
  const isPositive = close >= open;
  const color = isPositive ? "var(--success)" : "var(--danger)";
  const barHeight = Math.abs(y - height);
  
  return (
    <g key={x + y}>
      {/* Wick line */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x}
        y={isPositive ? y + height - barHeight : y}
        width={width}
        height={barHeight === 0 ? 1 : barHeight}
        fill={color}
      />
    </g>
  );
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-2 rounded-md text-xs shadow-sm">
        <p className="font-medium">{data.date}</p>
        <p>Open: <span className="font-medium">${data.open.toFixed(2)}</span></p>
        <p>High: <span className="font-medium">${data.high.toFixed(2)}</span></p>
        <p>Low: <span className="font-medium">${data.low.toFixed(2)}</span></p>
        <p>Close: <span className="font-medium">${data.close.toFixed(2)}</span></p>
        <p>Volume: <span className="font-medium">{(data.volume / 1000000).toFixed(2)}M</span></p>
      </div>
    );
  }
  return null;
};

export default function CandlestickChart({ data }: CandlestickChartProps) {
  // Prepare data for visualization
  const chartData = data.map((d) => ({
    ...d,
    // For rendering the candlestick
    bullHeight: d.close > d.open ? d.close - d.open : 0,
    bearHeight: d.close <= d.open ? d.open - d.close : 0,
    bullStart: d.close > d.open ? d.open : 0,
    bearStart: d.close <= d.open ? d.close : 0,
    // For rendering wicks
    highWick: d.high - Math.max(d.open, d.close),
    lowWick: Math.min(d.open, d.close) - d.low,
  }));
  
  // Calculate domain padding for the chart
  const allPrices = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const padding = (maxPrice - minPrice) * 0.1; // 10% padding
  
  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Price Action</h3>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="var(--secondary)"
                tickLine={false}
              />
              <YAxis 
                domain={[minPrice - padding, maxPrice + padding]}
                tick={{ fontSize: 12 }}
                stroke="var(--secondary)"
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* High wicks */}
              <Bar 
                dataKey="highWick" 
                fill="transparent" 
                shape={renderCandlestick} 
                isAnimationActive={false} 
              />
              
              {/* Bullish candles */}
              <Bar 
                dataKey="bullHeight" 
                stackId="a" 
                fill="var(--success)" 
                isAnimationActive={false} 
              />
              
              {/* Bearish candles */}
              <Bar 
                dataKey="bearHeight" 
                stackId="a" 
                fill="var(--danger)" 
                isAnimationActive={false} 
              />
              
              {/* Low wicks */}
              <Bar 
                dataKey="lowWick" 
                fill="transparent" 
                shape={renderCandlestick} 
                isAnimationActive={false} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 