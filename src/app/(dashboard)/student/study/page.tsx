import { StudyTimerClient } from "@/components/student/study-timer-client";
import type { StudySessionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getCurrentStreak(sessions: StudySessionRecord[]) {
  const activeDays = new Set(
    sessions
      .filter((session) => session.completed_focus_blocks > 0)
      .map((session) => getDayKey(session.started_at)),
  );

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default async function StudyTimerPage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("reader_id", student.id)
    .order("started_at", { ascending: false })
    .limit(45);

  const rows = (sessions ?? []) as StudySessionRecord[];
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const todayMinutes = rows
    .filter((session) => new Date(session.started_at) >= todayStart)
    .reduce((sum, session) => sum + session.focus_minutes * session.completed_focus_blocks, 0);

  const weekMinutes = rows
    .filter((session) => new Date(session.started_at) >= weekStart)
    .reduce((sum, session) => sum + session.focus_minutes * session.completed_focus_blocks, 0);

  const todayBlocks = rows
    .filter((session) => new Date(session.started_at) >= todayStart)
    .reduce((sum, session) => sum + session.completed_focus_blocks, 0);

  const totalBlocks = rows.reduce((sum, session) => sum + session.completed_focus_blocks, 0);

  // Generate last 7 days daily summary
  const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const minutes = rows
      .filter((s) => {
        const t = new Date(s.started_at).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      })
      .reduce((sum, s) => sum + s.focus_minutes * s.completed_focus_blocks, 0);
      
    return { dayLabel, minutes };
  });

  return (
    <StudyTimerClient
      insights={{
        todayMinutes,
        todayBlocks,
        weekMinutes,
        streakDays: getCurrentStreak(rows),
        totalBlocks,
        recentSessions: rows.slice(0, 5),
        weeklyChartData,
      }}
    />
  );
}
