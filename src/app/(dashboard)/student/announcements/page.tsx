import { Megaphone, Newspaper } from "lucide-react";

import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const typeBadge: Record<string, string> = {
  exam_alert: "bg-amber-50 text-amber-700 border-amber-200",
  job: "bg-blue-50 text-blue-700 border-blue-200",
  note: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default async function StudentAnnouncementsPage() {
  await requireDashboardContext(["student"]);
  const supabase = createAdminClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .in("audience", ["public", "student"])
    .order("published_at", { ascending: false })
    .limit(40);

  const allPosts = (posts ?? []) as PostRecord[];

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Announcements</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Hub Pinboard</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Central feed for public notices, exam updates, jobs, and study notes posted by staff.
        </p>
      </section>

      {allPosts.length > 0 ? (
        <div className="space-y-3">
          {allPosts.map((post) => (
            <div key={post.id} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow shadow-[#27452e]/4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-[#1b3022]">{post.title}</p>
                  {post.summary && <p className="mt-2 text-sm leading-6 text-[#536352]">{post.summary}</p>}
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] ${typeBadge[post.type] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                  {post.type.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{post.content}</p>
              <p className="mt-3 text-[10px] font-bold text-[#8a9d88]">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-12 text-center shadow-lg shadow-[#27452e]/6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
            <Newspaper className="h-8 w-8 text-[#6d7c6c]" />
          </div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">No announcements yet</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">Staff announcements will show up here.</p>
        </div>
      )}

      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 text-xs font-semibold text-[#536352]">
        <p className="inline-flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          For urgent issues, use the feedback form on your dashboard.
        </p>
      </div>
    </div>
  );
}
