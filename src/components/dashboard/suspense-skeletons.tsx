/**
 * Reusable Suspense skeleton components.
 * These are shown INSTANTLY while async server components load.
 */

export function CardsSkeleton({ count = 4, cols = 4 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg">
          <div className="h-2 w-20 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-[#e5ebe1]" />
        </div>
      ))}
    </div>
  );
}

export function FinanceCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg">
          <div className="h-2 w-20 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="mt-2 h-3 w-28 animate-pulse rounded-full bg-[#e5ebe1]" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg">
      <div className="h-2 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
      <div className="mt-4 h-64 animate-pulse rounded-2xl bg-[#f0f4ec]" />
    </div>
  );
}

export function ActivitySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg">
      <div className="h-2 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-[#e4eae0] pt-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#e5ebe1]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 animate-pulse rounded-full bg-[#e5ebe1]" />
              <div className="h-2.5 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-[1.8rem] border border-[#d8e0d4] bg-white" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-white shadow-lg">
      <div className="h-10 animate-pulse bg-[#f5f8f3]" />
      <div className="divide-y divide-[#e4eae0]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((__, j) => (
              <div key={j} className="h-4 flex-1 animate-pulse rounded-full bg-[#f0f4ec]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationPanelSkeleton() {
  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg">
      <div className="h-2 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[1.5rem] bg-[#f5f8f3] p-4 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded-full bg-[#e5ebe1]" />
            <div className="h-3 w-64 animate-pulse rounded-full bg-[#e5ebe1]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StudyProgressSkeleton() {
  return (
    <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl lg:p-8">
      <div className="flex justify-between">
        <div className="space-y-3">
          <div className="h-2 w-20 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-full bg-[#f0f4ec]" />
      </div>
      <div className="mt-8 h-3 w-full animate-pulse rounded-full bg-[#f0f4ec]" />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="h-16 animate-pulse rounded-2xl bg-[#f5f8f3]" />
        <div className="h-16 animate-pulse rounded-2xl bg-[#f5f8f3]" />
      </div>
    </div>
  );
}
