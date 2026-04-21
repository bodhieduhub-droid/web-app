import { CalendarManagerPage } from "@/components/dashboard/content-managers";
import type { CalendarEventRecord, PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { parseDayParam, parseMonthParam } from "@/lib/calendar-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminCalendarManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; draft?: string }>;
}) {
  await requireDashboardContext(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const { month: rawMonth, draft: rawDraft } = await searchParams;
  const draftDate = parseDayParam(rawDraft);
  const monthDate = parseMonthParam(rawMonth, draftDate ?? new Date());
  const [{ data: events }, { data: posts }] = await Promise.all([
    supabase.from("calendar_events").select("*").order("starts_at", { ascending: true }),
    supabase.from("posts").select("id, title, type").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <CalendarManagerPage
      basePath="/super-admin/content/calendar"
      monthDate={monthDate}
      draftDate={draftDate}
      events={(events ?? []) as CalendarEventRecord[]}
      relatedPosts={(posts ?? []) as Pick<PostRecord, "id" | "title" | "type">[]}
    />
  );
}
