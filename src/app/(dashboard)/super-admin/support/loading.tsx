import { SkeletonPageHeader, SkeletonTableRows } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader withButton={false} />
      <SkeletonTableRows rows={6} cols={4} />
    </div>
  );
}
