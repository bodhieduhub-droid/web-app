import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { NotificationRecord } from "@/lib/app-types";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

export async function StudentNotificationsSection({ studentId, profileId }: { studentId: string; profileId: string }) {
  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .or(`audience_id.eq.${studentId},audience_id.eq.${profileId},audience_type.eq.broadcast_role`)
    .order("created_at", { ascending: false })
    .limit(4);

  const allNotifications = (notifications ?? []) as (NotificationRecord & { metadata?: Record<string, any> })[];
  
  // Basic filtering for demo - ideally this matches the logic in the main page
  const recentNotifications = allNotifications.slice(0, 4);

  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
      <RealtimeTableListener table="notifications" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">Notifications</p>
        <Link href="/student/notifications" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1b3022]">View all →</Link>
      </div>
      <div className="mt-4 space-y-2">
        {recentNotifications.length > 0 ? (
          recentNotifications.map((n) => (
            <div key={n.id} className="rounded-2xl bg-[#f5f8f3] px-4 py-3">
              <p className="text-sm font-black text-[#1b3022]">{n.title}</p>
              <p className="mt-0.5 text-xs font-medium leading-5 text-[#536352]">{n.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm font-medium text-[#8a9d88]">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-6 w-24 animate-pulse rounded bg-gray-100" />
      <div className="h-20 w-full animate-pulse rounded-2xl bg-gray-50" />
      <div className="h-20 w-full animate-pulse rounded-2xl bg-gray-50" />
    </div>
  );
}
