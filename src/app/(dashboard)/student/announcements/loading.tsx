import { SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-24" />
        <SkeletonText className="mt-3 h-8 w-56" />
        <SkeletonText className="mt-2 h-3 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <SkeletonText className="h-4 w-40" />
            <SkeletonText className="mt-2 h-3 w-28" />
            <SkeletonText className="mt-4 h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
