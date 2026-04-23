import { SkeletonPageHeader, SkeletonText, SkeletonBox } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <SkeletonText className="h-4 w-40" />
            <SkeletonText className="mt-2 h-3 w-56" />
            <SkeletonBox className="mt-4 h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
