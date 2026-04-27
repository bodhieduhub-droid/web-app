import { createAdminClient } from "@/lib/supabase/admin";
import { BadgesSection } from "@/components/student/badges-section";
import type { StudentBadgeRecord } from "@/lib/app-types";

export async function StudentBadgesSectionWrapper({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();
  const { data: badgesData } = await supabase
    .from("student_badges")
    .select("*")
    .eq("reader_id", studentId);

  const earnedBadges = (badgesData ?? []) as StudentBadgeRecord[];

  if (earnedBadges.length === 0) return null;

  return <BadgesSection badges={earnedBadges} />;
}

export function BadgesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-[1.8rem] bg-gray-50 border border-gray-100" />
        ))}
      </div>
    </div>
  );
}
