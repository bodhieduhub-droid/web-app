import { SkeletonPageHeader, SkeletonStatGrid, SkeletonTableRows } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader withButton={false} />
      <SkeletonStatGrid count={5} />
      <SkeletonTableRows rows={10} cols={5} />
    </div>
  );
}
