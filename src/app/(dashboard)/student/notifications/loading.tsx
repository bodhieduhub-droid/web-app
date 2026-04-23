import { SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-28" />
        <SkeletonText className="mt-3 h-8 w-52" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`animate-pulse rounded-[1.8rem] border border-[#d8e0d4] p-4 ${i % 3 === 0 ? "bg-[#f0f7ed]" : "bg-white"}`}>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#e8eee4]" />
              <div className="flex-1 space-y-1.5">
                <SkeletonText className="h-3.5 w-48" />
                <SkeletonText className="h-3 w-64" />
                <SkeletonText className="h-2.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
