import { Suspense } from "react";

import { StudyTimerClient } from "@/components/student/study-timer-client";
import type { StudySessionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChartSkeleton } from "@/components/dashboard/suspense-skeletons";
import { getISTDateString, getISTStartOfDay } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

function getDayKey(value: string) {
  return getISTDateString(new Date(value));
}

function getCurrentStreak(sessions: StudySessionRecord[]) {
  const activeDays = new Set(
    sessions
      .filter((s) => s.completed_focus_blocks > 0)
      .map((s) => getDayKey(s.started_at)),
  );
  const cursor = new Date();
  let streak = 0;
  while (activeDays.has(getISTDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Async component — fetches session data independently
async function StudyInsights({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("reader_id", studentId)
    .order("started_at", { ascending: false })
    .limit(45);

  const rows = (sessions ?? []) as StudySessionRecord[];
  const todayStartStr = getISTStartOfDay();
  const todayStart = new Date(todayStartStr);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const todayMinutes = rows
    .filter((s) => new Date(s.started_at) >= todayStart)
    .reduce((sum, s) => sum + s.focus_minutes * s.completed_focus_blocks, 0);

  const weekMinutes = rows
    .filter((s) => new Date(s.started_at) >= weekStart)
    .reduce((sum, s) => sum + s.focus_minutes * s.completed_focus_blocks, 0);

  const todayBlocks = rows
    .filter((s) => new Date(s.started_at) >= todayStart)
    .reduce((sum, s) => sum + s.completed_focus_blocks, 0);

  const totalBlocks = rows.reduce((sum, s) => sum + s.completed_focus_blocks, 0);

  const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" });
    const dayStartStr = getISTStartOfDay(d);
    const dayStart = new Date(dayStartStr).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    const minutes = rows
      .filter((s) => {
        const t = new Date(s.started_at).getTime();
        return t >= dayStart && t <= dayEnd;
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

export default async function StudyTimerPage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-3 px-2 py-3 sm:space-y-5 sm:px-6 sm:py-5">
      {/* ── Page Header ── */}
      <section className="rounded-[2rem] bg-[#1b3022] px-5 py-3.5 text-white sm:rounded-3xl sm:px-8 sm:py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.45em] text-white/35 sm:text-[9px]">Focus Center</p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">Study Timer</h1>
          </div>
          <p className="hidden text-[11px] font-medium text-white/35 sm:block">
            Study hard, rest smart, track progress.
          </p>
        </div>
      </section>

      {/* ── Timer + Insights (SUSPENSE) ── */}
      <Suspense fallback={<ChartSkeleton />}>
        <StudyInsights studentId={student.id} />
      </Suspense>
    </div>
  );
}
