import Link from "next/link";
import {
  Bell,
  BookOpen,
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
  requestExitAction,
  startNightLogAction,
  submitStudentFeedbackAction,
  toggleTodoItemAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type {
  BillRecord,
  ExitRequestRecord,
  NotificationRecord,
  NightLogRecord,
  PostRecord,
  TodoItemRecord,
  TransactionRecord,
} from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const quickLinks = [
  { href: "/student/study", label: "Study Timer", sub: "Pomodoro focus mode", icon: Timer, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
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

  const [
    { data: bills },
    { data: transactions },
    { data: notifications },
    { data: todoItems },
    { data: interests },
    { data: exitRequests },
    { data: seatData },
    { data: nightLogs },
  ] = await Promise.all([
    supabase.from("bills").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
    supabase.from("transactions").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("notifications").select("*").or(`audience_id.eq.${student.id},audience_id.eq.${profile.id},audience_type.eq.broadcast_role`).order("created_at", { ascending: false }).limit(20),
    supabase.from("todo_items").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
    supabase.from("student_exam_interests").select("category").eq("reader_id", student.id),
    supabase.from("exit_requests").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }),
    student.fixed_seat_id
      ? supabase.from("seats").select("seat_number").eq("id", student.fixed_seat_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("night_logs").select("*").eq("reader_id", student.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const categories = (interests ?? []).map((i) => i.category as string);
  const allBills = (bills ?? []) as BillRecord[];
  const openBills = allBills.filter((b) => b.status !== "paid");
  const totalDue = openBills.reduce((s, b) => s + (b.amount_due - b.amount_paid), 0);
  const allNotificationRows = (notifications ?? []) as (NotificationRecord & { metadata?: Record<string, unknown> })[];
  const scopedNotifications = allNotificationRows.filter((n) => {
    if (n.audience_type === "reader") return n.audience_id === student.id;
    if (n.audience_type === "profile") return n.audience_id === profile.id;
    if (n.audience_type === "broadcast_role") return n.metadata?.role === "student";
    return false;
  });
  const notificationIds = scopedNotifications.map((n) => n.id);
  const { data: notificationReads } = notificationIds.length
    ? await supabase
        .from("notification_reads")
        .select("notification_id, read_at")
        .eq("profile_id", profile.id)
        .in("notification_id", notificationIds)
    : { data: [] as { notification_id: string; read_at: string }[] };
  const readMap = new Map((notificationReads ?? []).map((row) => [row.notification_id, row.read_at]));
  const recentNotifications = scopedNotifications
    .map((n) => ({
      ...n,
      effective_read_at: readMap.get(n.id) ?? (n.audience_type !== "broadcast_role" ? n.read_at : null),
    }))
    .slice(0, 4);
  const unreadCount = recentNotifications.filter((n) => !n.effective_read_at).length;
  const allTodos = (todoItems ?? []) as TodoItemRecord[];
  const pendingTodos = allTodos.filter((t) => !t.is_completed);
  const activeExitRequest = ((exitRequests ?? []) as ExitRequestRecord[]).find((r) => r.status === "pending");
  const recentNightLogs = (nightLogs ?? []) as NightLogRecord[];
  const activeNightLog = recentNightLogs.find((log) => log.status === "active" && !log.actual_exit_time);

  // Recent exam alerts
  let alertPosts: PostRecord[] = [];
  if (categories.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .eq("type", "exam_alert")
      .in("exam_category", categories)
      .order("published_at", { ascending: false })
      .limit(2);
    alertPosts = (data ?? []) as PostRecord[];
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Student Dashboard</p>
        <h1 className="mt-3 text-5xl font-black uppercase tracking-tight">{greeting},</h1>
        <h2 className="text-3xl font-black uppercase tracking-tight text-white/80">{student.name}</h2>
        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{cat}</span>
            ))}
          </div>
        )}
      </section>

      {/* ── Stats bar ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Status",
            value: student.status === "active" ? "Active" : student.status.replaceAll("_", " "),
            accent: student.status !== "active",
          },
          {
            label: "Monthly Fee",
            value: `₹${student.monthly_fee}`,
            accent: false,
          },
          {
            label: "Pending Due",
            value: totalDue > 0 ? `₹${totalDue.toFixed(0)}` : "₹0 — Cleared!",
            accent: totalDue > 0,
          },
          {
            label: "Seat",
            value: seatData?.seat_number ? `Seat #${seatData.seat_number}` : "Not Assigned",
            accent: !student.fixed_seat_id,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-[1.8rem] border p-5 shadow-md ${stat.accent ? "border-amber-200 bg-amber-50" : "border-[#d8e0d4] bg-white"}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{stat.label}</p>
            <p className={`mt-3 text-2xl font-black capitalize ${stat.accent ? "text-amber-800" : "text-[#1b3022]"}`}>
              {stat.value}
            </p>
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
        {/* ── Left: Todos ── */}
        <div className="space-y-6">
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
              <input
                name="title"
                placeholder="Add a study task…"
                className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none placeholder:text-[#a5b5a3]"
              />
              <input
                name="due_date"
                type="date"
                className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
              />
              <PendingSubmitButton
                idleLabel="Add"
                pendingLabel="Adding…"
                className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-md shadow-[#1b3022]/20 disabled:opacity-50"
              />
            </form>

            <div className="mt-4 space-y-2">
              {allTodos.length > 0 ? (
                allTodos.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-[#f5f8f3] px-4 py-3">
                    <form action={toggleTodoItemAction} className="flex min-w-0 flex-1 items-center gap-3">
                      <input type="hidden" name="todo_id" value={item.id} />
                      <input type="hidden" name="completed" value={item.is_completed ? "true" : "false"} />
                      <div className={`h-2 w-2 shrink-0 rounded-full ${item.is_completed ? "bg-[#b5c9b3]" : "bg-[#1b3022]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${item.is_completed ? "line-through text-[#8a9d88]" : "text-[#1b3022]"}`}>
                          {item.title}
                        </p>
                        {item.due_date && (
                          <p className="text-[10px] font-medium text-[#8a9d88]">Due {item.due_date}</p>
                        )}
                      </div>
                      <PendingSubmitButton
                        idleLabel={item.is_completed ? "Undo" : "Done"}
                        pendingLabel="…"
                        className="shrink-0 rounded-xl border border-[#d7ddd3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#536352] hover:bg-white transition disabled:opacity-40"
                      />
                    </form>
                    <form action={deleteTodoItemAction}>
                      <input type="hidden" name="todo_id" value={item.id} />
                      <PendingSubmitButton
                        idleLabel="Delete"
                        pendingLabel="…"
                        className="shrink-0 rounded-xl border border-red-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-700 hover:bg-red-50 transition disabled:opacity-40"
                      />
                    </form>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f5f8f3] p-4 text-center text-sm font-medium text-[#8a9d88]">
                  No tasks yet — add your first study goal above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Recent activity ── */}
        <div className="space-y-5">
          {/* Pending bills alert */}
          {openBills.length > 0 && (
            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow shadow-amber-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700">Payment Due</p>
                  <p className="mt-2 text-2xl font-black text-amber-900">₹{totalDue.toFixed(0)}</p>
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    {openBills.length} open invoice{openBills.length > 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  href="/student/payments"
                  className="shrink-0 rounded-2xl bg-amber-700 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white transition hover:bg-amber-800"
                >
                  Pay Now →
                </Link>
              </div>
            </div>
          )}

          {/* Recent exam alerts */}
          {alertPosts.length > 0 && (
            <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Latest Exam Alerts</p>
                <Link href="/student/exams" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1b3022]">View all →</Link>
              </div>
              <div className="mt-4 space-y-3">
                {alertPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl bg-[#f5f8f3] px-4 py-3">
                    <p className="text-sm font-black text-[#1b3022]">{post.title}</p>
                    {post.summary && <p className="mt-1 text-xs font-medium leading-5 text-[#536352]">{post.summary}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Notifications</p>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#1b3022] px-2 py-0.5 text-[9px] font-black text-white">{unreadCount}</span>
                )}
              </div>
              <Link href="/student/notifications" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1b3022]">View all →</Link>
            </div>
            <div className="mt-4 space-y-2">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((n) => (
                  <div key={n.id} className={`rounded-2xl px-4 py-3 ${!n.effective_read_at ? "bg-[#f0f7ed]" : "bg-[#f5f8f3]"}`}>
                    <p className="text-sm font-black text-[#1b3022]">{n.title}</p>
                    <p className="mt-0.5 text-xs font-medium leading-5 text-[#536352]">{n.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-medium text-[#8a9d88]">No notifications yet.</p>
              )}
            </div>
          </div>

          {/* Night log / late sitting */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Night Sitting Log</p>
            {activeNightLog ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-[#f5f8f3] px-4 py-3 text-sm font-medium text-[#536352]">
                  <p><strong>Entry:</strong> {new Date(activeNightLog.entry_time).toLocaleString("en-IN")}</p>
                  <p className="mt-1"><strong>Planned Exit:</strong> {new Date(activeNightLog.planned_exit_time).toLocaleString("en-IN")}</p>
                </div>
                <form action={endNightLogAction}>
                  <input type="hidden" name="night_log_id" value={activeNightLog.id} />
                  <PendingSubmitButton
                    idleLabel="End Session"
                    pendingLabel="Saving…"
                    className="rounded-2xl border border-[#d8e0d4] px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-[#1b3022] transition hover:bg-[#f3f7f0] disabled:opacity-50"
                  />
                </form>
              </div>
            ) : (
              <form action={startNightLogAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  name="planned_exit_time"
                  type="datetime-local"
                  required
                  className="flex-1 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
                />
                <PendingSubmitButton
                  idleLabel="Start Night Log"
                  pendingLabel="Starting…"
                  className="shrink-0 rounded-2xl border border-[#d8e0d4] px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-[#1b3022] transition hover:bg-[#f3f7f0] disabled:opacity-50"
                />
              </form>
            )}
            {recentNightLogs.length > 0 && (
              <p className="mt-3 text-xs font-medium text-[#8a9d88]">
                Last status: {recentNightLogs[0].status}
              </p>
            )}
          </div>

          {/* Feedback / complaint */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Feedback / Complaint</p>
            <form action={submitStudentFeedbackAction} className="mt-4 space-y-3">
              <input
                name="subject"
                placeholder="Subject"
                required
                className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
              />
              <textarea
                name="message"
                placeholder="Describe your issue or feedback"
                required
                className="min-h-28 w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
              />
              <PendingSubmitButton
                idleLabel="Send"
                pendingLabel="Sending…"
                className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white disabled:opacity-50"
              />
            </form>
          </div>

          {/* Exit request */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Off-boarding</p>
            {activeExitRequest ? (
              <div className="mt-4 rounded-2xl bg-[#f5f8f3] px-4 py-3 text-sm font-medium text-[#536352]">
                <p><strong>Status:</strong> <span className="capitalize">{activeExitRequest.status}</span></p>
                <p className="mt-1"><strong>Exit Date:</strong> {new Date(activeExitRequest.exit_date).toLocaleDateString("en-IN")}</p>
                <p className="mt-1"><strong>Refund Eligible:</strong> {activeExitRequest.refund_eligible ? "Yes" : "No"}</p>
              </div>
            ) : (
              <form action={requestExitAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  name="exit_date"
                  type="date"
                  required
                  className="flex-1 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] outline-none"
                />
                <PendingSubmitButton
                  idleLabel="Request Exit"
                  pendingLabel="Submitting…"
                  className="shrink-0 rounded-2xl border border-[#d8e0d4] px-5 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-[#1b3022] transition hover:bg-[#f3f7f0] disabled:opacity-50"
                />
              </form>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-[#aab5a8]">
              <DoorOpen className="h-3 w-3" />
              Caution deposit refund is processed upon exit approval.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
