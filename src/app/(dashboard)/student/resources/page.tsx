import Link from "next/link";
import { BookOpen, Briefcase, ChevronRight, FolderOpen } from "lucide-react";

import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { getPublicPostHref, isExternalHref } from "@/lib/post-links";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  UPSC: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SSC: "bg-amber-50 text-amber-700 border-amber-200",
  PSC: "bg-teal-50 text-teal-700 border-teal-200",
  BANKING: "bg-blue-50 text-blue-700 border-blue-200",
  RAILWAY: "bg-orange-50 text-orange-700 border-orange-200",
};

export default async function ResourcesPage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();

  const { data: interests } = await supabase
    .from("student_exam_interests")
    .select("category")
    .eq("reader_id", student.id);

  const categories = (interests ?? []).map((i) => i.category as string);

  // Get notes: personalized first, then all public
  const { data: notes } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("type", "note")
    .in("audience", ["student", "public"])
    .order("published_at", { ascending: false })
    .limit(30);

  const { data: jobs } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("type", "job")
    .in("audience", ["student", "public"])
    .order("published_at", { ascending: false })
    .limit(20);

  const allNotes = (notes ?? []) as PostRecord[];
  const allJobs = (jobs ?? []) as PostRecord[];

  // Personalized = posts matching their exam categories
  const personalizedNotes = categories.length > 0
    ? allNotes.filter((n) => !n.exam_category || categories.includes(n.exam_category))
    : allNotes;

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Resources</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Study Materials</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Notes and resources published by Bodhi Edu Hub staff
          {categories.length > 0 ? `, personalized for ${categories.join(", ")}` : ""}.
        </p>
        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{cat}</span>
            ))}
          </div>
        )}
      </section>

      {/* Notes Section */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef3ea]">
            <BookOpen className="h-4 w-4 text-[#536352]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Study Notes</p>
        </div>

        {personalizedNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {personalizedNotes.map((post) => (
              <div key={post.id} className="flex flex-col rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-black leading-tight text-[#1b3022]">{post.title}</p>
                  {post.exam_category && (
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${categoryColors[post.exam_category] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                      {post.exam_category}
                    </span>
                  )}
                </div>
                {post.summary && (
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#536352]">{post.summary}</p>
                )}
                <div className="mt-5 border-t border-[#eef3ea] pt-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{post.content}</p>
                </div>
                {post.link_url ? (
                  <div className="mt-4">
                    <Link
                      href={getPublicPostHref(post)}
                      target={isExternalHref(getPublicPostHref(post)) ? "_blank" : undefined}
                      rel={isExternalHref(getPublicPostHref(post)) ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022]"
                    >
                      Open Note
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
                <p className="mt-4 text-[10px] font-bold text-[#aab5a8]">
                  {post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg shadow-[#27452e]/6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
              <FolderOpen className="h-8 w-8 text-[#6d7c6c]" />
            </div>
            <p className="mt-4 text-lg font-black text-[#1b3022]">No notes yet</p>
            <p className="mt-2 text-sm font-medium text-[#536352]">Staff will publish study materials here. Check back soon.</p>
          </div>
        )}
      </div>

      {/* Jobs Section */}
      {allJobs.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef3ea]">
              <Briefcase className="h-4 w-4 text-[#536352]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Job Opportunities</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {allJobs.map((job) => (
              <div key={job.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-black leading-tight text-[#1b3022]">{job.title}</p>
                  {job.exam_category && (
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${categoryColors[job.exam_category] ?? "bg-[#f2f6ef] text-[#60705f] border-[#d8e0d4]"}`}>
                      {job.exam_category}
                    </span>
                  )}
                </div>
                {job.summary && <p className="mt-3 text-sm leading-6 text-[#536352]">{job.summary}</p>}
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{job.content}</p>
                {job.link_url ? (
                  <div className="mt-4">
                    <Link
                      href={getPublicPostHref(job)}
                      target={isExternalHref(getPublicPostHref(job)) ? "_blank" : undefined}
                      rel={isExternalHref(getPublicPostHref(job)) ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022]"
                    >
                      Open Link
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
                <p className="mt-4 text-[10px] font-bold text-[#aab5a8]">
                  {job.published_at ? new Date(job.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
