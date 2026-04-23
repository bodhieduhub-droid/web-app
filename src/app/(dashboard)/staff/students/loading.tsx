import { SkeletonPageHeader, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonText className="h-5 w-40" />
                <SkeletonText className="h-3 w-32" />
              </div>
              <div className="space-y-2 text-right">
                <SkeletonText className="h-3 w-16 ml-auto" />
                <SkeletonText className="h-4 w-24 ml-auto" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-[1.4rem] bg-[#f5f8f3] p-4">
                  <SkeletonText className="h-2.5 w-16" />
                  <SkeletonText className="mt-2 h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
