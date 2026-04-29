import Link from "next/link";
import { Suspense } from "react";
import { Megaphone, Newspaper } from "lucide-react";

import { ExpandableText } from "@/components/student/expandable-text";
import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListSkeleton } from "@/components/dashboard/suspense-skeletons";
import { DebouncedSearch } from "@/components/ui/debounced-search";

export const dynamic = "force-dynamic";

const typeBadge: Record<string, string> = {
  exam_alert: "bg-amber-50 text-amber-700 border-amber-200",
  job: "bg-blue-50 text-blue-700 border-blue-200",
  note: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const announcementFilters = [
  ["all", "All"],
  ["exam_alert", "Exam Alerts"],
  ["job", "Jobs"],
  ["note", "Notes"],
] as const;

async function AnnouncementsFeed({ 
  activeFilter, query 
}: { activeFilter: string; query: string }) {
  const supabase = createAdminClient();
  
  let baseQuery = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .in("audience", ["public", "student"])
    .order("published_at", { ascending: false });

  if (query) {
    baseQuery = baseQuery.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
  }

  const { data: posts } = await baseQuery.limit(50);
  const allPosts = (posts ?? []) as PostRecord[];
  
  const filteredPosts = activeFilter === "all"
    ? allPosts
    : allPosts.filter((post) => post.type === activeFilter);

  if (filteredPosts.length === 0) {
    return (
      <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-12 text-center shadow-lg shadow-[#27452e]/6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
          <Newspaper className="h-8 w-8 text-[#6d7c6c]" />
        </div>
        <p className="mt-4 text-lg font-black text-[#1b3022]">
          No posts found.
        </p>
        <p className="mt-2 text-sm font-medium text-[#536352]">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.map((post) => (
        <div key={post.id} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black text-[#1b3022] leading-tight">{post.title}</p>
              {post.summary && <p className="mt-2 text-sm leading-6 text-[#536352]">{post.summary}</p>}
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${typeBadge[post.type] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
              {post.type.replaceAll("_", " ")}
            </span>
          </div>
          <div className="mt-5 border-t border-[#f0f4ee] pt-4">
            <ExpandableText text={post.content} />
          </div>
          <p className="mt-4 text-[10px] font-bold text-[#8a9d88] uppercase tracking-widest">
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })
              : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function StudentAnnouncementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  await requireDashboardContext(["student"]);
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeFilter = announcementFilters.some(([value]) => value === resolvedSearchParams.filter)
    ? resolvedSearchParams.filter!
    : "all";
  const query = (resolvedSearchParams.q ?? "").trim();

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Announcements</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Hub Pinboard</h1>
          <p className="mt-4 text-base font-medium leading-7 text-white/80 max-w-xl">
            Central feed for public notices, exam updates, jobs, and study notes posted by staff.
          </p>
        </div>
        
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search pinboard..." 
          className="w-full lg:w-96 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </section>

      {/* ── Filter Tabs (INSTANT — no data needed) ── */}
      <section className="flex flex-wrap gap-2">
        {announcementFilters.map(([value, label]) => {
          const active = value === activeFilter;
          return (
            <Link
              key={value}
              href={`/student/announcements?${new URLSearchParams({ 
                filter: value,
                ...(query ? { q: query } : {})
              }).toString()}`}
              prefetch={false}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "border-[#1b3022] bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/20" : "border-[#d8e0d4] bg-white text-[#536352] hover:border-[#1b3022]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </section>

      <Suspense key={activeFilter + query} fallback={<ListSkeleton rows={4} />}>
        <AnnouncementsFeed activeFilter={activeFilter} query={query} />
      </Suspense>

      {/* ── Footer tip (INSTANT) ── */}
      <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 text-xs font-semibold text-[#536352] shadow-sm">
        <p className="inline-flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#1b3022]" />
          For urgent issues, use the feedback form on your dashboard.
        </p>
      </div>
    </div>
  );
}
