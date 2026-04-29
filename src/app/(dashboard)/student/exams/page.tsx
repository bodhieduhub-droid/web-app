import Link from "next/link";
import { Suspense } from "react";
import { Inbox, Pin, Search } from "lucide-react";

import { ExpandableText } from "@/components/student/expandable-text";
import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListSkeleton } from "@/components/dashboard/suspense-skeletons";
import { DebouncedSearch } from "@/components/ui/debounced-search";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  UPSC: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200", pill: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  SSC:  { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200",  pill: "bg-amber-100 text-amber-700 border-amber-200" },
  PSC:  { bg: "bg-teal-50",   text: "text-teal-800",   border: "border-teal-200",   pill: "bg-teal-100 text-teal-700 border-teal-200" },
  BANKING: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200",   pill: "bg-blue-100 text-blue-700 border-blue-200" },
  RAILWAY: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", pill: "bg-orange-100 text-orange-700 border-orange-200" },
};

async function ExamsFeed({ studentId, filter, query }: { studentId: string; filter: string; query: string }) {
  const supabase = createAdminClient();
  const { data: interests } = await supabase.from("student_exam_interests").select("category").eq("reader_id", studentId);
  const categories = (interests ?? []).map((i) => i.category as string);

  let examsQuery = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("type", "exam_alert")
    .order("published_at", { ascending: false });

  if (categories.length > 0) {
    examsQuery = examsQuery.in("exam_category", categories);
  }

  if (query) {
    examsQuery = examsQuery.or(`title.ilike.%${query}%,summary.ilike.%${query}%`);
  }

  const { data: examAlertsRaw } = await examsQuery.limit(50);
  const examAlerts = (examAlertsRaw ?? []) as PostRecord[];

  const availableCategories = Array.from(new Set(examAlerts.map((p) => p.exam_category).filter(Boolean) as string[]));
  const activeFilter = filter && (filter === "all" || availableCategories.includes(filter)) ? filter : "all";
  const filtered = activeFilter === "all" ? examAlerts : examAlerts.filter((p) => p.exam_category === activeFilter);
  
  const grouped: Record<string, PostRecord[]> = {};
  for (const post of filtered) {
    const cat = post.exam_category ?? "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(post);
  }

  return (
    <div className="space-y-8">
      {categories.length === 0 && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2"><Pin className="h-4 w-4 text-amber-700" /><p className="font-black text-amber-800">Set your exam preferences</p></div>
          <p className="mt-2 text-sm font-medium text-amber-700">Go to <Link href="/student/profile" className="underline font-bold">My Profile</Link> and select the exams you&apos;re preparing for.</p>
        </div>
      )}
      {availableCategories.length > 0 && (
        <section className="flex flex-wrap gap-2">
          <Link 
            href={`/student/exams${query ? `?q=${query}` : ""}`} 
            prefetch={false} 
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === "all" ? "border-[#1b3022] bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/20" : "border-[#d8e0d4] bg-white text-[#536352] hover:border-[#1b3022]"}`}
          >
            All
          </Link>
          {availableCategories.map((cat) => (
            <Link 
              key={cat} 
              href={`/student/exams?filter=${cat}${query ? `&q=${query}` : ""}`} 
              prefetch={false} 
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeFilter === cat ? "border-[#1b3022] bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/20" : "border-[#d8e0d4] bg-white text-[#536352] hover:border-[#1b3022]"}`}
            >
              {cat}
            </Link>
          ))}
        </section>
      )}
      {filtered.length === 0 ? (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]"><Inbox className="h-8 w-8 text-[#6d7c6c]" /></div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">No alerts found</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, posts]) => {
            const colors = categoryColors[cat];
            return (
              <div key={cat}>
                <div className="mb-4 flex items-center gap-3">
                  {colors && <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] ${colors.pill}`}>{cat}</span>}
                  <div className="flex-1 border-t border-[#e5ebe1]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {posts.map((post) => {
                    const c = colors ?? { bg: "bg-[#f7faf5]", text: "text-[#1b3022]", border: "border-[#d8e0d4]" };
                    return (
                      <div key={post.id} className={`rounded-[2rem] border ${c.border} ${c.bg} p-6 shadow-sm hover:shadow-md transition-shadow bg-white`}>
                        <p className={`text-lg font-black leading-tight ${c.text}`}>{post.title}</p>
                        {post.summary && <p className="mt-3 text-sm leading-6 text-[#536352]">{post.summary}</p>}
                        <div className="mt-4 border-t border-[#d8e0d4]/50 pt-4"><ExpandableText text={post.content} /></div>
                        <p className="mt-4 text-[10px] font-bold text-[#aab5a8] uppercase tracking-widest">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function ExamsPage({ searchParams }: { searchParams?: Promise<{ filter?: string; q?: string }> }) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const filter = resolvedSearchParams.filter ?? "all";
  const query = (resolvedSearchParams.q ?? "").trim();

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Exam Alerts</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Your Exam Feed</h1>
          <p className="mt-4 text-base font-medium leading-7 text-white/80 max-w-xl">
            Personalized exam alerts based on your study preferences.
          </p>
        </div>
        
        <DebouncedSearch 
          defaultValue={query} 
          placeholder="Search exams..." 
          className="w-full lg:w-96 bg-white/10 border-white/20 text-white placeholder:text-white/40"
        />
      </section>

      <Suspense key={filter + query} fallback={<ListSkeleton rows={4} />}>
        <ExamsFeed studentId={student.id} filter={filter} query={query} />
      </Suspense>
    </div>
  );
}
