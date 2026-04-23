import { SkeletonPageHeader, SkeletonStatGrid, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-32" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[1.8rem] border-2 border-[#e4eae0] bg-white p-5">
              <SkeletonText className="h-6 w-12 mx-auto" />
              <SkeletonText className="mt-3 h-3 w-20 mx-auto" />
              <SkeletonText className="mt-2 h-2.5 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
