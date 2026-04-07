import { Inbox, Pin } from "lucide-react";

import type { PostRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const categoryColors: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  UPSC: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200", pill: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  SSC:  { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-200",  pill: "bg-amber-100 text-amber-700 border-amber-200" },
  PSC:  { bg: "bg-teal-50",   text: "text-teal-800",   border: "border-teal-200",   pill: "bg-teal-100 text-teal-700 border-teal-200" },
  BANKING: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200",   pill: "bg-blue-100 text-blue-700 border-blue-200" },
  RAILWAY: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", pill: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default async function ExamsPage() {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();

  const { data: interests } = await supabase
    .from("student_exam_interests")
    .select("category")
    .eq("reader_id", student.id);

  const categories = (interests ?? []).map((i) => i.category as string);

  // Exam alerts (personalized to their categories)
  let examAlerts: PostRecord[] = [];
  if (categories.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .eq("type", "exam_alert")
      .in("exam_category", categories)
      .order("published_at", { ascending: false })
      .limit(20);
    examAlerts = (data ?? []) as PostRecord[];
  } else {
    // No categories - show all exam alerts
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .eq("type", "exam_alert")
      .order("published_at", { ascending: false })
      .limit(20);
    examAlerts = (data ?? []) as PostRecord[];
  }

  const groupedByCategory: Record<string, PostRecord[]> = {};
  for (const post of examAlerts) {
    const cat = post.exam_category ?? "General";
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(post);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Exam Alerts</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">
          {categories.length > 0 ? "Your Exam Feed" : "All Exam Alerts"}
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          {categories.length > 0
            ? `Showing alerts for: ${categories.join(", ")}. Update your preferences in My Profile.`
            : "You haven't selected exam categories yet. Go to My Profile to personalize your feed."}
        </p>
        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const color = categoryColors[cat];
              return (
                <span key={cat} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{cat}</span>
              );
            })}
          </div>
        )}
      </section>

      {categories.length === 0 && (
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow shadow-amber-200/30">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-amber-700" />
            <p className="font-black text-amber-800">Set your exam preferences</p>
          </div>
          <p className="mt-2 text-sm font-medium text-amber-700">
            Go to <a href="/student/profile" className="underline font-bold">My Profile</a> and select the exams you're preparing for to get personalized alerts.
          </p>
        </div>
      )}

      {examAlerts.length === 0 ? (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg shadow-[#27452e]/6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
            <Inbox className="h-8 w-8 text-[#6d7c6c]" />
          </div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">No alerts yet</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">
            Exam alerts will be posted here by your hub staff. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedByCategory).map(([cat, posts]) => {
            const colors = categoryColors[cat];
            return (
              <div key={cat}>
                <div className="mb-4 flex items-center gap-3">
                  {colors && (
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] ${colors.pill}`}>
                      {cat}
                    </span>
                  )}
                  <div className="flex-1 border-t border-[#e5ebe1]" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {posts.map((post) => {
                    const colors2 = colors ?? { bg: "bg-[#f7faf5]", text: "text-[#1b3022]", border: "border-[#d8e0d4]" };
                    return (
                      <div key={post.id} className={`rounded-[2rem] border ${colors2.border} ${colors2.bg} p-6 shadow shadow-[#27452e]/6`}>
                        <p className={`text-lg font-black leading-tight ${colors2.text}`}>{post.title}</p>
                        {post.summary && (
                          <p className="mt-3 text-sm leading-6 text-[#536352]">{post.summary}</p>
                        )}
                        <div className="mt-4 border-t border-white/50 pt-4">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{post.content}</p>
                        </div>
                        <p className="mt-4 text-[10px] font-bold text-[#aab5a8]">
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : ""}
                        </p>
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
