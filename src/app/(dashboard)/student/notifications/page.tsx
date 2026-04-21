import Link from "next/link";
import { Bell, BellRing, Briefcase, GraduationCap, Inbox, Megaphone, User, Wallet } from "lucide-react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(dashboard)/actions";
import type { NotificationRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const NOTIFICATION_PAGE_SIZE = 20;

const categoryIconMap: Record<string, React.ElementType> = {
  billing: Wallet,
  payment: Wallet,
  exam_alert: GraduationCap,
  account: User,
  announcement: Megaphone,
  job: Briefcase,
};

const categoryColor: Record<string, string> = {
  billing: "border-l-amber-400",
  payment: "border-l-amber-400",
  exam_alert: "border-l-blue-400",
  account: "border-l-emerald-400",
  announcement: "border-l-purple-400",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cursor?: string }>;
}) {
  const { student, profile } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const cursor = resolvedSearchParams.cursor ?? null;

  let notificationQuery = supabase
    .from("notifications")
    .select("*")
    .or(`audience_id.eq.${student.id},audience_id.eq.${profile.id},audience_type.eq.broadcast_role`)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_PAGE_SIZE + 1);

  if (cursor) {
    notificationQuery = notificationQuery.lt("created_at", cursor);
  }

  const { data: notifications } = await notificationQuery;

  const filteredNotifications = ((notifications ?? []) as (NotificationRecord & { metadata?: Record<string, unknown> })[])
    .filter((n) => {
      if (n.audience_type === "reader") return n.audience_id === student.id;
      if (n.audience_type === "profile") return n.audience_id === profile.id;
      if (n.audience_type === "broadcast_role") return n.metadata?.role === "student";
      return false;
    });
  const hasMore = filteredNotifications.length > NOTIFICATION_PAGE_SIZE;
  const pagedNotifications = filteredNotifications.slice(0, NOTIFICATION_PAGE_SIZE);
  const nextCursor = pagedNotifications.at(-1)?.created_at ?? null;
  const notificationIds = pagedNotifications.map((n) => n.id);
  const { data: notificationReads } = notificationIds.length
    ? await supabase
        .from("notification_reads")
        .select("notification_id, read_at")
        .eq("profile_id", profile.id)
        .in("notification_id", notificationIds)
    : { data: [] as { notification_id: string; read_at: string }[] };

  const readMap = new Map((notificationReads ?? []).map((row) => [row.notification_id, row.read_at]));
  const allNotifications = pagedNotifications.map((n) => ({
    ...n,
    effective_read_at: readMap.get(n.id) ?? (n.audience_type !== "broadcast_role" ? n.read_at : null),
  }));
  const unread = allNotifications.filter((n) => !n.effective_read_at);

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Notifications</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Your Inbox</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Stay updated with payment confirmations, exam alerts, and hub announcements.
        </p>
        {unread.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
              <BellRing className="h-4 w-4" />
              {unread.length} unread {unread.length === 1 ? "notification" : "notifications"}
            </div>
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10">
                Mark All Read
              </button>
            </form>
          </div>
        )}
      </section>

      {allNotifications.length === 0 ? (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-12 text-center shadow-lg shadow-[#27452e]/6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
            <Inbox className="h-8 w-8 text-[#6d7c6c]" />
          </div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">All caught up!</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">No notifications yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allNotifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-[1.8rem] border-l-4 border border-[#d8e0d4] bg-white p-5 shadow shadow-[#27452e]/4 ${categoryColor[n.category] ?? "border-l-[#1b3022]"} ${!n.effective_read_at ? "ring-1 ring-[#1b3022]/8" : "opacity-80"}`}
            >
              <div className="flex items-start gap-4">
                {(() => { const Icon = categoryIconMap[n.category] ?? Bell; return <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ea]"><Icon className="h-4 w-4 text-[#536352]" /></div>; })()}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-[#1b3022]">{n.title}</p>
                    <div className="flex items-center gap-2">
                      {!n.effective_read_at && (
                        <span className="rounded-full bg-[#1b3022] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">New</span>
                      )}
                      <p className="text-[10px] font-bold text-[#8a9d88]">
                        {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#536352]">{n.body}</p>
                  {!n.effective_read_at && (
                    <form action={markNotificationReadAction} className="mt-2">
                      <input type="hidden" name="notification_id" value={n.id} />
                      <button type="submit" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]">
                        Mark Read
                      </button>
                    </form>
                  )}
                  {n.link && (n.link.startsWith("/") ? (
                    <Link href={n.link} className="mt-2 inline-block text-xs font-bold text-[#1b3022] underline underline-offset-2">
                      View →
                    </Link>
                  ) : (
                    <a href={n.link} className="mt-2 inline-block text-xs font-bold text-[#1b3022] underline underline-offset-2">
                      View →
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {hasMore && nextCursor ? (
            <div className="pt-2">
              <Link
                href={`/student/notifications?cursor=${encodeURIComponent(nextCursor)}`}
                prefetch={false}
                className="inline-flex rounded-2xl border border-[#d8e0d4] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
              >
                Load older notifications
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
