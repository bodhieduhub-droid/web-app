import { SkeletonPageHeader, SkeletonStatGrid, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader withButton={false} />
      <SkeletonStatGrid count={4} />
      {/* Chart skeleton */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-40" />
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      {/* Activity log skeleton */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-32" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-[#e4eae0] pt-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#e8eee4] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonText className="h-3 w-48" />
                <SkeletonText className="h-2.5 w-32" />
              </div>
              <SkeletonText className="h-2.5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
