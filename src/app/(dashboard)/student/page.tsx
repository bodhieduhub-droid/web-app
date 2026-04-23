import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  DoorOpen,
  GraduationCap,
  Timer,
  User,
} from "lucide-react";

import {
  createTodoItemAction,
  deleteTodoItemAction,
  endNightLogAction,
  startNightLogAction,
  toggleTodoItemAction,
} from "@/app/(dashboard)/actions";
import { ExitRequestForm } from "@/components/student/exit-request-form";
import { SupportTicketForm } from "@/components/student/support-ticket-form";
import { AttendanceCard } from "@/components/student/attendance-card";
import { BadgesSection } from "@/components/student/badges-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { StudentBillsSection, BillsSkeleton } from "@/components/student/dashboard/bills-section";
import { StudentNotificationsSection, NotificationsSkeleton } from "@/components/student/dashboard/notifications-section";
import type {
  AttendanceRecord,
  StudentBadgeRecord,
  TodoItemRecord,
  NightLogRecord,
  ExitRequestRecord,
  StudentSupportTicketRecord,
} from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/student/study", label: "Study Timer", sub: "Pomodoro focus mode", icon: Timer, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { href: "/student/calendar", label: "Calendar", sub: "Dates and deadlines", icon: CalendarDays, color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
  { href: "/student/exams", label: "Exam Alerts", sub: "Your personalized feed", icon: GraduationCap, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { href: "/student/resources", label: "Resources", sub: "Notes & job posts", icon: BookOpen, color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" },
  { href: "/student/announcements", label: "Announcements", sub: "Pinboard from staff", icon: Bell, color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
  { href: "/student/payments", label: "Payments", sub: "Bills & proof upload", icon: CircleDollarSign, color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { href: "/student/notifications", label: "Notifications", sub: "Hub updates & alerts", icon: Bell, color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  { href: "/student/profile", label: "My Profile", sub: "Membership & preferences", icon: User, color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" },
];

export default async function StudentDashboard() {
  const { student, profile } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();

  // ONLY fetch critical, fast data at the top level
  const [
    { data: seatData },
    todayAttendanceData,
    badgesData,
    recentAttendanceData,
    { data: todoItems },
    { data: exitRequests },
    { data: nightLogs },
    { data: supportTickets },
  ] = await Promise.all([
    student.fixed_seat_id
      ? supabase.from("seats").select("seat_number").eq("id", student.fixed_seat_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("attendance").select("*").eq("reader_id", student.id).eq("date", new Date().toISOString().split("T")[0]).maybeSingle(),
    supabase.from("student_badges").select("*").eq("reader_id", student.id),
    supabase.from("attendance").select("date").eq("reader_id", student.id).order("date", { ascending: false }).limit(31),
    supabase.from("todo_items").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
    supabase.from("exit_requests").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
    supabase.from("night_logs").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("student_support_tickets").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Streak calculation (Fast, client-side logic)
  const streakHistory = (recentAttendanceData?.data ?? []) as { date: string }[];
  let currentStreak = 0;
  if (streakHistory.length > 0) {
    const today = new Date().toISOString().split("T")[0];
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
  const earnedBadges = (badgesData?.data ?? []) as StudentBadgeRecord[];
  const allTodos = (todoItems ?? []) as TodoItemRecord[];
  const pendingTodos = allTodos.filter((t) => !t.is_completed);
  const activeExitRequest = ((exitRequests ?? []) as ExitRequestRecord[]).find((r) => r.status === "pending");
  const recentNightLogs = (nightLogs ?? []) as NightLogRecord[];
  const activeNightLog = recentNightLogs.find((log) => log.status === "active" && !log.actual_exit_time);
  const supportTicketRows = (supportTickets ?? []) as StudentSupportTicketRecord[];

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT RENDER) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Student Dashboard</p>
        <h1 className="mt-3 text-5xl font-black uppercase tracking-tight">{greeting},</h1>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white/80">{student.name}</h2>
      </section>

      {/* ── Attendance & Badges (FAST DATA) ── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <AttendanceCard todayAttendance={todayAttendance} streakCount={currentStreak} />
        <div className="flex-1 min-w-0">
          <BadgesSection badges={earnedBadges} />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Status", value: student.status === "active" ? "Active" : student.status.replaceAll("_", " "), accent: student.status !== "active" },
          { label: "Monthly Fee", value: `₹${student.monthly_fee}`, accent: false },
          { label: "Seat", value: seatData?.seat_number ? `Seat #${seatData.seat_number}` : "Not Assigned", accent: !student.fixed_seat_id },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-[1.8rem] border p-5 shadow-md ${stat.accent ? "border-amber-200 bg-amber-50" : "border-[#d8e0d4] bg-white"}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{stat.label}</p>
            <p className={`mt-3 text-2xl font-black capitalize ${stat.accent ? "text-amber-800" : "text-[#1b3022]"}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      {/* ── Quick Links ── */}
      <section>
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Quick Access</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, sub, icon: Icon, color }) => (
            <Link key={href} href={href} className={`group flex items-center gap-4 rounded-[1.8rem] border p-4 shadow transition ${color}`}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/60 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black">{label}</p>
                <p className="text-xs font-medium opacity-70">{sub}</p>
              </div>
              <span className="ml-auto text-sm font-bold opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-70">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {/* ── Todos ── */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Focus Checklist</p>
                <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Your Tasks</h2>
              </div>
              {pendingTodos.length > 0 && (
                <span className="rounded-full bg-[#1b3022] px-3 py-1 text-xs font-black text-white">
                  {pendingTodos.length} left
                </span>
              )}
            </div>

            <form action={createTodoItemAction} className="mt-5 grid gap-2 sm:grid-cols-[1fr_160px_auto]">
              <input name="title" placeholder="Add a study task…" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none" />
              <input name="due_date" type="date" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none" />
              <PendingSubmitButton idleLabel="Add" pendingLabel="..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase text-white" />
            </form>

            <div className="mt-4 space-y-2">
              {allTodos.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#f5f8f3] px-4 py-3">
                  <form action={toggleTodoItemAction} className="flex flex-1 items-center gap-3">
                    <input type="hidden" name="todo_id" value={item.id} />
                    <div className={`h-2 w-2 rounded-full ${item.is_completed ? "bg-gray-300" : "bg-[#1b3022]"}`} />
                    <p className={`text-sm font-bold ${item.is_completed ? "line-through text-gray-400" : "text-[#1b3022]"}`}>{item.title}</p>
                    <PendingSubmitButton idleLabel={item.is_completed ? "Undo" : "Done"} pendingLabel="…" className="ml-auto text-[10px] font-black uppercase" />
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── SLOW DATA (SUSPENSE) ── */}
          <Suspense fallback={<BillsSkeleton />}>
            <StudentBillsSection studentId={student.id} />
          </Suspense>

          <Suspense fallback={<NotificationsSkeleton />}>
            <StudentNotificationsSection studentId={student.id} profileId={profile.id} />
          </Suspense>

          {/* Support Ticket form (Client Action) */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Support Desk</p>
            <SupportTicketForm />
          </div>

          {/* Exit request */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Off-boarding</p>
            {activeExitRequest ? (
              <div className="mt-4 rounded-2xl bg-[#f5f8f3] px-4 py-3 text-sm font-medium">
                <p><strong>Status:</strong> <span className="capitalize">{activeExitRequest.status}</span></p>
                <p><strong>Exit Date:</strong> {new Date(activeExitRequest.exit_date).toLocaleDateString("en-IN")}</p>
              </div>
            ) : <ExitRequestForm />}
          </div>
        </div>
      </section>
    </div>
  );
}
