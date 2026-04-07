export default function StudentLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="h-44 animate-pulse rounded-[2.4rem] bg-[#d0dbc9]" />

      {/* Stats skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[1.8rem] border border-[#d8e0d4] bg-white">
            <div className="m-5 h-2 w-16 animate-pulse rounded-full bg-[#e5ebe1]" />
            <div className="mx-5 h-6 w-24 animate-pulse rounded-full bg-[#e5ebe1]" />
          </div>
        ))}
      </div>

      {/* Quick links skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-[1.8rem] border border-[#d8e0d4] bg-white" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-72 animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white" />
        <div className="space-y-5">
          <div className="h-24 animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white" />
          <div className="h-40 animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white" />
        </div>
      </div>
    </div>
  );
}
