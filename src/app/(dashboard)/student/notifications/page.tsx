import Link from "next/link";
import { Suspense } from "react";
import { Bell, BellRing, Briefcase, GraduationCap, Inbox, Megaphone, User, Wallet } from "lucide-react";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/(dashboard)/actions";
import type { NotificationRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListSkeleton } from "@/components/dashboard/suspense-skeletons";
import { DebouncedSearch } from "@/components/ui/debounced-search";

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

async function NotificationsList({
  studentId, profileId, cursor, query
}: { studentId: string; profileId: string; cursor: string | null; query: string }) {
  const supabase = createAdminClient();
  
  let baseQuery = supabase
    .from("notifications")
    .select("*")
    .or(`audience_id.eq.${studentId},audience_id.eq.${profileId},audience_type.eq.broadcast_role`)
    .order("created_at", { ascending: false });

  if (query) {
    baseQuery = baseQuery.or(`title.ilike.%${query}%,body.ilike.%${query}%`);
  }

  if (cursor) {
    baseQuery = baseQuery.lt("created_at", cursor);
  }

  const { data: notifications } = await baseQuery.limit(NOTIFICATION_PAGE_SIZE + 1);
  
  const filtered = ((notifications ?? []) as (NotificationRecord & { metadata?: Record<string, unknown> })[])
    .filter((n) => {
      if (n.audience_type === "reader") return n.audience_id === studentId;
      if (n.audience_type === "profile") return n.audience_id === profileId;
      if (n.audience_type === "broadcast_role") return n.metadata?.role === "student";
      return false;
    });

  const hasMore = filtered.length > NOTIFICATION_PAGE_SIZE;
  const paged = filtered.slice(0, NOTIFICATION_PAGE_SIZE);
  const nextCursor = paged.at(-1)?.created_at ?? null;
  
  const ids = paged.map((n) => n.id);
  const { data: reads } = ids.length
    ? await supabase.from("notification_reads").select("notification_id, read_at").eq("profile_id", profileId).in("notification_id", ids)
    : { data: [] as { notification_id: string; read_at: string }[] };
    
  const readMap = new Map((reads ?? []).map((r) => [r.notification_id, r.read_at]));
  const all = paged.map((n) => ({ 
    ...n, 
    effective_read_at: readMap.get(n.id) ?? (n.audience_type !== "broadcast_role" ? n.read_at : null) 
  }));

  if (all.length === 0) return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-12 text-center shadow-lg shadow-[#27452e]/6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]"><Inbox className="h-8 w-8 text-[#6d7c6c]" /></div>
      <p className="mt-4 text-lg font-black text-[#1b3022]">All caught up!</p>
      <p className="mt-2 text-sm font-medium text-[#536352]">No notifications found. Check back soon.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {all.map((n) => {
        const Icon = categoryIconMap[n.category] ?? Bell;
        return (
          <div key={n.id} className={`rounded-[1.8rem] border-l-4 border border-[#d8e0d4] bg-white p-5 shadow shadow-[#27452e]/4 ${categoryColor[n.category] ?? "border-l-[#1b3022]"} ${!n.effective_read_at ? "ring-1 ring-[#1b3022]/8" : "opacity-80"}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ea]"><Icon className="h-4 w-4 text-[#536352]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-[#1b3022]">{n.title}</p>
                  <div className="flex items-center gap-2">
                    {!n.effective_read_at && <span className="rounded-full bg-[#1b3022] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">New</span>}
                    <p className="text-[10px] font-bold text-[#8a9d88]">{new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#536352]">{n.body}</p>
                {!n.effective_read_at && (
                  <form action={markNotificationReadAction} className="mt-2">
                    <input type="hidden" name="notification_id" value={n.id} />
                    <button type="submit" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]">Mark Read</button>
                  </form>
                )}
                {n.link && (n.link.startsWith("/") ? (
                  <Link href={n.link} className="mt-2 inline-block text-xs font-bold text-[#1b3022] underline underline-offset-2">View →</Link>
                ) : (
                  <a href={n.link} className="mt-2 inline-block text-xs font-bold text-[#1b3022] underline underline-offset-2">View →</a>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {hasMore && nextCursor && (
        <div className="pt-2">
          <Link 
            href={`/student/notifications?cursor=${encodeURIComponent(nextCursor)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} 
            prefetch={false} 
            className="inline-flex rounded-2xl border border-[#d8e0d4] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022] hover:bg-[#f5f8f3]"
          >
            Load older notifications
          </Link>
        </div>
      )}
    </div>
  );
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cursor?: string; q?: string }>;
}) {
  const { student, profile } = await requireDashboardContext(["student"]);
  if (!student) return null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const cursor = resolvedSearchParams.cursor ?? null;
  const query = (resolvedSearchParams.q ?? "").trim();

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Notifications</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Your Inbox</h1>
          <p className="mt-4 text-base font-medium leading-7 text-white/80 max-w-xl">
            Stay updated with payment confirmations, exam alerts, and hub announcements.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10">
                Mark All Read
              </button>
            </form>
          </div>
        </div>
        
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search notifications..." 
          className="w-full lg:w-96 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </section>

      <Suspense key={query + cursor} fallback={<ListSkeleton rows={5} />}>
        <NotificationsList 
          studentId={student.id} 
          profileId={profile.id} 
          cursor={cursor} 
          query={query}
        />
      </Suspense>
    </div>
  );
}
