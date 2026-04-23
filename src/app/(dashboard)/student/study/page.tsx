import { Suspense } from "react";

import { StudyTimerClient } from "@/components/student/study-timer-client";
import type { StudySessionRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChartSkeleton } from "@/components/dashboard/suspense-skeletons";

export const dynamic = "force-dynamic";

function getDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getCurrentStreak(sessions: StudySessionRecord[]) {
  const activeDays = new Set(
    sessions
      .filter((s) => s.completed_focus_blocks > 0)
      .map((s) => getDayKey(s.started_at)),
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
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

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

export default async function StudyTimerPage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Study Timer</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Focus Session</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Track your daily focus blocks, streaks, and weekly study progress.
        </p>
      </section>

      {/* ── Timer + Insights (SUSPENSE — streams independently) ── */}
      <Suspense fallback={<ChartSkeleton />}>
        <StudyInsights studentId={student.id} />
      </Suspense>
    </div>
  );
}
