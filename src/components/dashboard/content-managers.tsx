import Link from "next/link";

import { createPostAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { PostRecord } from "@/lib/app-types";

type PostRow = PostRecord & {
  created_at?: string;
  updated_at?: string;
};

function sectionRows(rows: PostRow[], key: "blog" | "note" | "job" | "alert") {
  if (key === "blog") return rows.filter((post) => post.type === "blog");
  if (key === "note") return rows.filter((post) => post.type === "note" && post.audience === "public");
  if (key === "job") return rows.filter((post) => post.type === "job");
  return rows.filter((post) => post.type === "exam_alert" || (post.type === "note" && post.audience === "student"));
}

function typeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function ManagerList({
  rows,
  emptyLabel,
  detailBasePath,
}: {
  rows: PostRow[];
  emptyLabel: string;
  detailBasePath?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
      <div className="divide-y divide-[#e4eae0]">
        {rows.length > 0 ? (
          rows.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-black text-[#1b3022]">{post.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#6d7c6c]">
                  {typeLabel(post.type)} · {post.status} · {post.audience}
                </p>
              </div>
              {detailBasePath ? (
                <Link href={`${detailBasePath}/${post.id}`} className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022]">
                  Manage
                </Link>
              ) : null}
            </div>
          ))
        ) : (
          <p className="px-5 py-8 text-sm font-semibold text-[#6d7c6c]">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}

export function ContentHub({
  basePath,
  rows,
}: {
  basePath: string;
  rows: PostRow[];
}) {
  const cards = [
    { slug: "blogs", label: "Blog Manager", count: sectionRows(rows, "blog").length, note: "Articles with image and rich text" },
    { slug: "notes", label: "Notes Manager", count: sectionRows(rows, "note").length, note: "Public study notes and references" },
    { slug: "jobs", label: "Jobs Manager", count: sectionRows(rows, "job").length, note: "Openings, notifications, and links" },
    { slug: "alerts", label: "Alerts Manager", count: sectionRows(rows, "alert").length, note: "Student announcements and exam alerts" },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.slug}
          href={`${basePath}/${card.slug}`}
          className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 transition-transform hover:-translate-y-0.5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{card.label}</p>
          <p className="mt-3 text-4xl font-black text-[#1b3022]">{card.count}</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">{card.note}</p>
        </Link>
      ))}
    </section>
  );
}

export function NotesManagerPage({
  rows,
  detailBasePath,
}: {
  rows: PostRow[];
  detailBasePath?: string;
}) {
  const noteRows = sectionRows(rows, "note");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Notes Manager</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Create And Manage Notes</h1>
      </section>

      <form action={createPostAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <input type="hidden" name="type" value="note" />
        <input type="hidden" name="audience" value="public" />
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <input name="title" placeholder="Note title" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <select name="exam_category" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">No exam category</option>
            {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select name="status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Publish now</option>
          </select>
        </div>
        <input name="summary" placeholder="Summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="link_url" placeholder="Reference / PDF link (optional)" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <textarea name="content" placeholder="Study note content" className="min-h-36 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
        <PendingSubmitButton idleLabel="Create Note" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" />
      </form>

      <ManagerList rows={noteRows} emptyLabel="No notes yet." detailBasePath={detailBasePath} />
    </div>
  );
}

export function JobsManagerPage({
  rows,
  detailBasePath,
}: {
  rows: PostRow[];
  detailBasePath?: string;
}) {
  const jobRows = sectionRows(rows, "job");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Jobs Manager</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Create And Manage Jobs</h1>
      </section>

      <form action={createPostAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <input type="hidden" name="type" value="job" />
        <div className="grid gap-3 md:grid-cols-[180px_180px_220px_1fr]">
          <select name="audience" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="public">Public</option>
            <option value="student">Student</option>
          </select>
          <select name="status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Publish now</option>
          </select>
          <select name="exam_category" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">No exam category</option>
            {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input name="title" placeholder="Job title" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        </div>
        <input name="summary" placeholder="Summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="link_url" placeholder="Application link / notification link" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <textarea name="content" placeholder="Job details" className="min-h-36 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
        <PendingSubmitButton idleLabel="Create Job" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" />
      </form>

      <ManagerList rows={jobRows} emptyLabel="No jobs yet." detailBasePath={detailBasePath} />
    </div>
  );
}

export function AlertsManagerPage({
  rows,
  detailBasePath,
}: {
  rows: PostRow[];
  detailBasePath?: string;
}) {
  const alertRows = sectionRows(rows, "alert");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Alerts Manager</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Create And Manage Alerts</h1>
      </section>

      <form action={createPostAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="grid gap-3 md:grid-cols-4">
          <select name="type" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="announcement">Announcement (Student + Mail)</option>
            <option value="exam_alert">Exam Alert</option>
          </select>
          <select name="status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Publish now</option>
          </select>
          <select name="exam_category" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">No exam category</option>
            {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input name="title" placeholder="Alert title" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <select name="target_status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">Announcement target: all active + pending students</option>
            <option value="active">Only active</option>
            <option value="pending_payment">Only pending payment</option>
            <option value="pending_onboarding">Only pending onboarding</option>
            <option value="archived">Only archived</option>
          </select>
          <select name="target_exam_category" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">Announcement target: all exam categories</option>
            {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
              <option key={category} value={category}>{category} interested students</option>
            ))}
          </select>
          <select name="only_exam_preparing" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="no">Include all students</option>
            <option value="yes">Only students preparing for exams</option>
          </select>
        </div>
        <input name="summary" placeholder="Summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <textarea name="content" placeholder="Announcement or alert content" className="min-h-36 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
        <PendingSubmitButton idleLabel="Create Alert" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" />
      </form>

      <ManagerList rows={alertRows} emptyLabel="No alerts yet." detailBasePath={detailBasePath} />
    </div>
  );
}
