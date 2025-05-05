export default function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-center text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--border-color)]"></div>
            <div className="h-4 w-12 bg-[var(--border-color)] rounded"></div>
          </div>
          <div className="h-4 w-16 bg-[var(--border-color)] rounded"></div>
          <div className="h-4 w-20 bg-[var(--border-color)] rounded"></div>
          <div className="h-4 w-16 bg-[var(--border-color)] rounded"></div>
        </div>
      ))}
    </div>
  );
} 