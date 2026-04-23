import { SkeletonText, SkeletonBox } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="h-2.5 w-24" />
        <SkeletonText className="mt-3 h-8 w-48" />
      </div>
      {/* Timer display */}
      <div className="mx-auto max-w-md rounded-[2.4rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg shadow-[#27452e]/6">
        <SkeletonText className="mx-auto h-20 w-48" />
        <SkeletonText className="mx-auto mt-4 h-3 w-24" />
        <div className="mt-8 flex justify-center gap-3">
          <SkeletonBox className="h-12 w-28" />
          <SkeletonBox className="h-12 w-28" />
        </div>
      </div>
      <SkeletonBox className="h-32 w-full rounded-[2rem]" />
    </div>
  );
}
