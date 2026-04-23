// Shared skeleton primitives for consistent loading states across the dashboard

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-[#e8eee4] ${className}`} />
  );
}

export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[#e8eee4] ${className}`} />
  );
}

export function SkeletonCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
      {children}
    </div>
  );
}

export function SkeletonStatGrid({ count = 5 }: { count?: number }) {
  return (
    <section className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
          <SkeletonText className="h-2.5 w-20" />
          <SkeletonText className="mt-3 h-8 w-24" />
        </div>
      ))}
    </section>
  );
}

export function SkeletonTableRows({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
      {/* Header */}
      <div className="grid bg-[#f5f8f3] px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} className="h-2.5 w-16" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid items-center border-t border-[#e4eae0] px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="space-y-2">
              <SkeletonText className={`h-3 w-${j === 0 ? "32" : j === cols - 1 ? "16" : "24"}`} />
              {j === 0 && <SkeletonText className="h-2 w-20" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPageHeader({ withButton = true }: { withButton?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
      <div className="space-y-3">
        <SkeletonText className="h-2.5 w-28" />
        <SkeletonText className="h-9 w-56" />
      </div>
      {withButton && <SkeletonBox className="h-10 w-32" />}
    </div>
  );
}
