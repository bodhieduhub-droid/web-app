import { SkeletonText, SkeletonBox } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-20" />
        <SkeletonText className="mt-3 h-8 w-48" />
      </div>
      {/* Bills */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <SkeletonText className="h-4 w-40" />
                <SkeletonText className="h-3 w-24" />
              </div>
              <div className="space-y-2 text-right">
                <SkeletonText className="h-6 w-20 ml-auto" />
                <SkeletonBox className="h-8 w-28 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
