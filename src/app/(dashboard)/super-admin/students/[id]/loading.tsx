import { SkeletonBox, SkeletonPageHeader, SkeletonStatGrid, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonText className="h-2.5 w-24" />
            <SkeletonText className="h-9 w-48" />
            <SkeletonText className="h-3 w-32" />
            <SkeletonText className="h-3 w-28" />
          </div>
          <div className="space-y-2 text-right">
            <SkeletonText className="h-3 w-20 ml-auto" />
            <SkeletonText className="h-8 w-32 ml-auto" />
            <SkeletonBox className="h-8 w-28 ml-auto" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-[1.3rem] bg-[#f5f8f3] p-4">
              <SkeletonText className="h-2.5 w-16" />
              <SkeletonText className="mt-3 h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
      {/* Onboarding details */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-36" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#f5f8f3] p-4">
              <SkeletonText className="h-2.5 w-16" />
              <SkeletonText className="mt-2 h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
      {/* Action cards */}
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <SkeletonText className="h-2.5 w-24" />
            <SkeletonBox className="mt-4 h-11" />
          </div>
        ))}
      </div>
      {/* Billing table */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-28" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 border-t border-[#e4eae0] pt-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <SkeletonText key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
