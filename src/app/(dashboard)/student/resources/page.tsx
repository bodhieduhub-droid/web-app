import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, Briefcase, ChevronRight, FolderOpen } from "lucide-react";

import { toggleSavedPostAction, updatePostRevisionAction } from "@/app/(dashboard)/actions";
import { ExpandableText } from "@/components/student/expandable-text";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { getPublicPostHref, isExternalHref } from "@/lib/post-links";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListSkeleton } from "@/components/dashboard/suspense-skeletons";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, string> = {
  UPSC: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SSC: "bg-amber-50 text-amber-700 border-amber-200",
  PSC: "bg-teal-50 text-teal-700 border-teal-200",
  BANKING: "bg-blue-50 text-blue-700 border-blue-200",
  RAILWAY: "bg-orange-50 text-orange-700 border-orange-200",
};

const resourceViews = [
  ["all", "All"],
  ["notes", "Notes"],
  ["jobs", "Jobs"],
] as const;

// Async component — fetches all resource data independently
async function ResourcesContent({ studentId, view, category }: { studentId: string; view: string; category: string }) {
  const supabase = createAdminClient();
  const [{ data: interests }, { data: notes }, { data: jobs }, { data: activityRows }] = await Promise.all([
    supabase.from("student_exam_interests").select("category").eq("reader_id", studentId),
    supabase.from("posts").select("*").eq("status", "published").eq("type", "note").in("audience", ["student", "public"]).order("published_at", { ascending: false }).limit(30),
    supabase.from("posts").select("*").eq("status", "published").eq("type", "job").in("audience", ["student", "public"]).order("published_at", { ascending: false }).limit(20),
    supabase.from("student_post_activity").select("*").eq("reader_id", studentId),
  ]);
  const categories = (interests ?? []).map((i) => i.category as string);
  const allNotes = (notes ?? []) as PostRecord[];
  const allJobs = (jobs ?? []) as PostRecord[];
  const activityByPostId = new Map((activityRows ?? []).map((row) => [row.post_id as string, row as { is_saved: boolean; is_revised: boolean; revision_due_on?: string | null; revised_at?: string | null }]));
  const personalizedNotes = categories.length > 0 ? allNotes.filter((n) => !n.exam_category || categories.includes(n.exam_category)) : allNotes;
  const resourceCategories = Array.from(new Set([...personalizedNotes, ...allJobs].map((p) => p.exam_category).filter(Boolean) as string[]));
  const activeView = resourceViews.some(([v]) => v === view) ? view : "all";
  const activeCategory = category && resourceCategories.includes(category) ? category : "all";
  const filteredNotes = activeCategory === "all" ? personalizedNotes : personalizedNotes.filter((p) => p.exam_category === activeCategory);
  const filteredJobs = activeCategory === "all" ? allJobs : allJobs.filter((p) => p.exam_category === activeCategory);
  const revisionQueue = personalizedNotes.filter((note) => activityByPostId.get(note.id)?.is_saved).sort((l, r) => (activityByPostId.get(l.id)?.revision_due_on ?? "9999").localeCompare(activityByPostId.get(r.id)?.revision_due_on ?? "9999"));

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

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {resourceViews.map(([value, label]) => {
            const params = new URLSearchParams();
            if (value !== "all") params.set("view", value);
            if (activeCategory !== "all") params.set("category", activeCategory);
            const active = activeView === value;
            return (
              <Link
                key={value}
                href={params.toString() ? `/student/resources?${params.toString()}` : "/student/resources"}
                prefetch={false}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  active ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] bg-white text-[#536352]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {resourceCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={activeView === "all" ? "/student/resources" : `/student/resources?view=${activeView}`}
              prefetch={false}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeCategory === "all" ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] bg-white text-[#536352]"
              }`}
            >
              All categories
            </Link>
            {resourceCategories.map((category) => {
              const params = new URLSearchParams();
              if (activeView !== "all") params.set("view", activeView);
              params.set("category", category);
              return (
                <Link
                  key={category}
                  href={`/student/resources?${params.toString()}`}
                  prefetch={false}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] bg-white text-[#536352]"
                  }`}
                >
                  {category}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {revisionQueue.length > 0 && (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Revision Queue</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {revisionQueue.slice(0, 6).map((note) => {
              const activity = activityByPostId.get(note.id);
              return (
                <div key={note.id} className="rounded-[1.6rem] bg-[#f5f8f3] p-4">
                  <p className="text-sm font-black text-[#1b3022]">{note.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7c6c]">
                    {activity?.is_revised ? "Reviewed" : "Needs review"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#536352]">
                    {activity?.revision_due_on
                      ? `Next review ${new Date(activity.revision_due_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                      : "No next review date"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {((activeView === "notes" && filteredNotes.length === 0) ||
        (activeView === "jobs" && filteredJobs.length === 0)) && (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg shadow-[#27452e]/6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
            <FolderOpen className="h-8 w-8 text-[#6d7c6c]" />
          </div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">No resources in this filter</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">
            Try another category or switch between notes and jobs.
          </p>
        </div>
      )}

      {/* Notes Section */}
      {(activeView === "all" || activeView === "notes") && (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef3ea]">
            <BookOpen className="h-4 w-4 text-[#536352]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Study Notes</p>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((post) => {
              const activity = activityByPostId.get(post.id);
              const isSaved = activity?.is_saved === true;
              const isRevised = activity?.is_revised === true;

              return (
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
                    <ExpandableText text={post.content} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={toggleSavedPostAction}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <input type="hidden" name="save" value={isSaved ? "no" : "yes"} />
                      <PendingSubmitButton
                        idleLabel={isSaved ? "Unsave" : "Save"}
                        pendingLabel="Saving..."
                        className="rounded-2xl border border-[#d7ddd3] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1b3022]"
                      />
                    </form>
                    <form action={updatePostRevisionAction}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <input type="hidden" name="mode" value={isRevised ? "needs_revision" : "revised"} />
                      <PendingSubmitButton
                        idleLabel={isRevised ? "Review Again" : "Mark Revised"}
                        pendingLabel="Updating..."
                        className="rounded-2xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white"
                      />
                    </form>
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
                    {activity?.revision_due_on
                      ? `Next review ${new Date(activity.revision_due_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
              );
            })}
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
      )}

      {/* Jobs Section */}
      {(activeView === "all" || activeView === "jobs") && filteredJobs.length > 0 && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef3ea]">
              <Briefcase className="h-4 w-4 text-[#536352]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Job Opportunities</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredJobs.map((job) => (
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
                <div className="mt-4">
                  <ExpandableText text={job.content} />
                </div>
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

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; category?: string }>;
}) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const view = resolvedSearchParams.view ?? "all";
  const category = resolvedSearchParams.category ?? "all";

  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Resources</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Study Materials</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Notes and resources published by Bodhi Edu Hub staff.
        </p>
      </section>

      {/* ── Content (SUSPENSE — streams independently) ── */}
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <ResourcesContent studentId={student.id} view={view} category={category} />
      </Suspense>
    </div>
  );
}
