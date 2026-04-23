import { SkeletonText, SkeletonBox } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-20" />
        <SkeletonText className="mt-3 h-8 w-48" />
      </div>
      {/* Month nav */}
      <div className="flex items-center justify-between rounded-2xl border border-[#d8e0d4] bg-white px-5 py-3">
        <SkeletonBox className="h-8 w-16" />
        <SkeletonText className="h-5 w-32" />
        <SkeletonBox className="h-8 w-16" />
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-xl bg-[#e8eee4]" />
        ))}
      </div>
    </div>
  );
}
