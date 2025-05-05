import { cn } from "@/lib/utils";

interface HealthFactorProgressProps {
  healthFactor: number;
  className?: string;
}

export function HealthFactorProgress({ healthFactor, className }: HealthFactorProgressProps) {
  // Define thresholds
  const LIQUIDATION_THRESHOLD = 1.0;
  const RISKY_THRESHOLD = 1.5;
  const SAFE_THRESHOLD = 2.0;

  // Calculate progress percentage (capped at 100%)
  const progress = Math.min((healthFactor / SAFE_THRESHOLD) * 100, 100);

  // Determine color based on health factor
  const getProgressColor = () => {
    if (healthFactor <= LIQUIDATION_THRESHOLD) {
      return "bg-[var(--danger)]";
    } else if (healthFactor <= RISKY_THRESHOLD) {
      return "bg-[var(--warning)]";
    } else {
      return "bg-[var(--success)]";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">Health Factor</span>
        <span className="text-sm font-medium">{healthFactor.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-[var(--border-color)]/20 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getProgressColor()
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--secondary)]">Liquidation</span>
        <span className="text-xs text-[var(--secondary)]">Safe</span>
      </div>
    </div>
  );
} 