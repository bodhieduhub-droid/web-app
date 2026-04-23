import { SkeletonPageHeader, SkeletonStatGrid, SkeletonTableRows } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      {/* Filter bar */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_160px_auto]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-2xl bg-[#e8eee4]" />
          ))}
        </div>
      </div>
      <SkeletonStatGrid count={5} />
      <SkeletonTableRows rows={8} cols={6} />
    </div>
  );
}
