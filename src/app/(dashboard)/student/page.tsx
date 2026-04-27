import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getISTDateString } from "@/lib/date-utils";

import { AttendanceCard } from "@/components/student/attendance-card";
import { StudentHero } from "@/components/student/dashboard/student-hero";
import { QuickLinks } from "@/components/student/dashboard/quick-links";
import { StudentTodoSection, TodoSkeleton } from "@/components/student/dashboard/todo-section";
import { StudentBadgesSectionWrapper, BadgesSkeleton } from "@/components/student/dashboard/badges-section-wrapper";
import { StudentBillsSection, BillsSkeleton } from "@/components/student/dashboard/bills-section";
import { StudentNotificationsSection, NotificationsSkeleton } from "@/components/student/dashboard/notifications-section";
import { StudyProgressCard, StudyProgressSkeleton } from "@/components/student/dashboard/study-progress-card";
import { SupportTicketForm } from "@/components/student/support-ticket-form";
import { ExitRequestForm } from "@/components/student/exit-request-form";

import type {
  AttendanceRecord,
  ExitRequestRecord,
} from "@/lib/app-types";
import { formatToIST } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const { student, profile } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();

  // ONLY fetch critical, fast data at the top level
  const [
    { data: seatData },
    todayAttendanceData,
    recentAttendanceData,
    { data: exitRequests },
  ] = await Promise.all([
    student.fixed_seat_id
      ? supabase.from("seats").select("seat_number").eq("id", student.fixed_seat_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("attendance").select("*").eq("reader_id", student.id).eq("date", getISTDateString()).maybeSingle(),
    supabase.from("attendance").select("date").eq("reader_id", student.id).order("date", { ascending: false }).limit(31),
    supabase.from("exit_requests").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
  ]);

  // Streak calculation (Fast, client-side logic on server)
  const streakHistory = (recentAttendanceData?.data ?? []) as { date: string }[];
  let currentStreak = 0;
  if (streakHistory.length > 0) {
    const today = getISTDateString();
    const firstDate = streakHistory[0].date;
    const d1 = new Date(today);
    const d2 = new Date(firstDate);
    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
    
    if (diff <= 1) {
      currentStreak = 1;
      for (let i = 0; i < streakHistory.length - 1; i++) {
        const dateA = new Date(streakHistory[i].date);
        const dateB = new Date(streakHistory[i+1].date);
        const dDiff = (dateA.getTime() - dateB.getTime()) / (1000 * 3600 * 24);
        if (Math.round(dDiff) === 1) currentStreak++;
        else break;
      }
    }
  }

  const todayAttendance = todayAttendanceData?.data as AttendanceRecord | null;
  const activeExitRequest = ((exitRequests ?? []) as ExitRequestRecord[]).find((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Dashboard Hero (GREETING & STATUS) ── */}
      <StudentHero 
        studentName={student.name} 
        seatNumber={seatData?.seat_number}
        streakCount={currentStreak}
      />

      {/* ── Today's Focus Grid (PRESENCE & PROGRESS) ── */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Attendance Card */}
        <AttendanceCard todayAttendance={todayAttendance} streakCount={currentStreak} />
        
        {/* Study Progress Card (LAZY) */}
        <Suspense fallback={<StudyProgressSkeleton />}>
          <StudyProgressCard studentId={student.id} />
        </Suspense>
      </div>

      {/* ── Quick Access (CRITICAL) ── */}
      <QuickLinks />

      {/* ── Main Dashboard Content ── */}
      <div className="grid gap-8 xl:grid-cols-12">
        {/* Left Column: Tasks & Stats */}
        <div className="space-y-10 xl:col-span-7">
          {/* ── Checklist (LAZY) ── */}
          <Suspense fallback={<TodoSkeleton />}>
            <StudentTodoSection studentId={student.id} />
          </Suspense>

          {/* ── Badges Section (LAZY) ── */}
          <Suspense fallback={<BadgesSkeleton />}>
            <StudentBadgesSectionWrapper studentId={student.id} />
          </Suspense>
        </div>

        {/* Right Column: Bills, Notifications & Support */}
        <div className="space-y-8 xl:col-span-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-1">
            {[
              { label: "Seat Assignment", value: seatData?.seat_number ? `Seat #${seatData.seat_number}` : "Not Assigned", accent: !student.fixed_seat_id, sub: student.fixed_seat_id ? "Personal desk" : "Contact staff" },
              { label: "Subscription", value: student.status === "active" ? "Active Member" : student.status.replaceAll("_", " "), accent: student.status !== "active", sub: `Plan: ₹${student.monthly_fee}/mo` },
            ].map((stat) => (
              <div key={stat.label} className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-sm transition-all hover:shadow-md ${stat.accent ? "border-amber-200 bg-amber-50" : "border-[#d8e0d4] bg-white"}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{stat.label}</p>
                <p className={`mt-3 text-2xl font-black capitalize ${stat.accent ? "text-amber-800" : "text-[#1b3022]"}`}>{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-[#8a9d88]">{stat.sub}</p>
              </div>
            ))}
          </div>

          <Suspense fallback={<BillsSkeleton />}>
            <StudentBillsSection studentId={student.id} />
          </Suspense>

          <Suspense fallback={<NotificationsSkeleton />}>
            <StudentNotificationsSection studentId={student.id} profileId={profile.id} />
          </Suspense>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            {/* Support Ticket form */}
            <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Hub Support</p>
              <h3 className="mt-1 text-lg font-black text-[#1b3022]">Need Assistance?</h3>
              <div className="mt-4">
                <SupportTicketForm />
              </div>
            </div>

            {/* Exit request */}
            <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Membership</p>
              <h3 className="mt-1 text-lg font-black text-[#1b3022]">Request Off-boarding</h3>
              <div className="mt-4">
                {activeExitRequest ? (
                  <div className="rounded-2xl bg-[#f5f8f3] p-4 text-sm font-medium border border-[#e1eadc]">
                    <div className="flex justify-between">
                      <span className="font-bold text-[#6d7c6c]">Status:</span>
                      <span className="font-black text-[#1b3022] capitalize">{activeExitRequest.status}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="font-bold text-[#6d7c6c]">Exit Date:</span>
                      <span className="font-black text-[#1b3022]">{formatToIST(activeExitRequest.exit_date).split(",")[0]}</span>
                    </div>
                  </div>
                ) : <ExitRequestForm />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

