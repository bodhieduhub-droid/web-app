import { SkeletonText, SkeletonBox } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Profile hero */}
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 animate-pulse rounded-3xl bg-[#e8eee4]" />
          <div className="space-y-2">
            <SkeletonText className="h-5 w-40" />
            <SkeletonText className="h-3 w-28" />
            <SkeletonText className="h-3 w-24" />
          </div>
        </div>
      </div>
      {/* Details grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5">
            <SkeletonText className="h-2.5 w-20" />
            <SkeletonText className="mt-2 h-5 w-36" />
          </div>
        ))}
      </div>
      <SkeletonBox className="h-40 w-full rounded-[2rem]" />
    </div>
  );
}
