import { SkeletonPageHeader, SkeletonStatGrid, SkeletonTableRows } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <SkeletonStatGrid count={4} />
      <SkeletonTableRows rows={8} cols={5} />
    </div>
  );
}
