import Link from "next/link";

import {
  createCalendarEventAction,
  createPostAction,
  deleteCalendarEventAction,
  updateCalendarEventAction,
} from "@/app/(dashboard)/actions";
import { CalendarMonthGrid } from "@/components/calendar/month-grid";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { CalendarEventRecord, PostRecord } from "@/lib/app-types";
import {
  addMonths,
  type CalendarGridItem,
  endOfMonth,
  eventIntersectsRange,
  formatCalendarDateLabel,
  formatCalendarMonthLabel,
  formatDayParam,
  formatMonthParam,
  isSameMonth,
  startOfMonth,
} from "@/lib/calendar-utils";

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

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatDraftDateTimeInput(value: Date | null) {
  if (!value) return "";
  const draft = new Date(value.getFullYear(), value.getMonth(), value.getDate(), 9, 0, 0, 0);
  return formatDateTimeInput(draft.toISOString());
}

const calendarEventTypes = [
  ["exam_deadline", "Exam Deadline"],
  ["exam_date", "Exam Date"],
  ["admit_card", "Admit Card"],
  ["result", "Result"],
  ["hub_event", "Hub Event"],
  ["holiday", "Holiday"],
  ["other", "Other"],
] as const;

const calendarEventStatuses = [
  ["draft", "Draft"],
  ["published", "Published"],
  ["archived", "Archived"],
] as const;

const calendarAudiences = [
  ["student", "Student"],
  ["public", "Public"],
] as const;

const calendarEventGridClasses: Record<CalendarEventRecord["event_type"], string> = {
  exam_deadline: "border-rose-200 bg-rose-50 text-rose-700",
  exam_date: "border-amber-200 bg-amber-50 text-amber-700",
  admit_card: "border-sky-200 bg-sky-50 text-sky-700",
  result: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hub_event: "border-cyan-200 bg-cyan-50 text-cyan-700",
  holiday: "border-slate-200 bg-slate-100 text-slate-700",
  other: "border-[#d8e0d4] bg-[#eef3ea] text-[#536352]",
};

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

export function CalendarManagerPage({
  events,
  relatedPosts,
  basePath,
  monthDate,
  draftDate,
}: {
  events: CalendarEventRecord[];
  relatedPosts: Pick<PostRecord, "id" | "title" | "type">[];
  basePath: string;
  monthDate: Date;
  draftDate: Date | null;
}) {
  const previousMonth = addMonths(monthDate, -1);
  const nextMonth = addMonths(monthDate, 1);
  const monthEvents = events.filter((event) => eventIntersectsRange(event, startOfMonth(monthDate), endOfMonth(monthDate)));
  const monthGridEvents: CalendarGridItem[] = monthEvents.map((event) => ({
    id: event.id,
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    is_all_day: event.is_all_day,
    chipClassName: calendarEventGridClasses[event.event_type],
  }));
  const selectedDraftDate = draftDate && isSameMonth(draftDate, monthDate) ? draftDate : null;
  const draftStartsAtValue = formatDraftDateTimeInput(selectedDraftDate);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Calendar Manager</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Create And Manage Calendar Events</h1>
        <p className="mt-3 text-sm font-semibold text-[#536352]">
          Navigate by month and year, then click any date in the grid to preload the event form for that day.
        </p>
      </section>

      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Month Overview</p>
            <h2 className="mt-2 text-3xl font-black text-[#1b3022]">{formatCalendarMonthLabel(monthDate)}</h2>
            <p className="mt-2 text-sm font-semibold text-[#536352]">
              {selectedDraftDate ? `Creating against ${formatCalendarDateLabel(selectedDraftDate)}.` : "Pick a date tile to prefill the start date in the event form."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Link
                href={`${basePath}?month=${formatMonthParam(previousMonth)}`}
                className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1b3022]"
              >
                Prev
              </Link>
              <Link
                href={`${basePath}?month=${formatMonthParam(nextMonth)}`}
                className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1b3022]"
              >
                Next
              </Link>
            </div>

            <form method="get" className="flex flex-wrap items-center gap-2">
              <input
                name="month"
                type="month"
                defaultValue={formatMonthParam(monthDate)}
                className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]"
              />
              <button
                type="submit"
                className="rounded-2xl bg-[#1b3022] px-4 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-white"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </section>

      <CalendarMonthGrid
        events={monthGridEvents}
        monthDate={monthDate}
        selectedDate={selectedDraftDate}
        title="Calendar Canvas"
        subtitle="Click a date to load it into the create form. Existing events stay visible in the month they belong to."
        dayHref={(day) => `${basePath}?month=${formatMonthParam(monthDate)}&draft=${formatDayParam(day)}`}
      />

      <form action={createCalendarEventAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        {selectedDraftDate ? (
          <div className="rounded-2xl bg-[#f5f8f3] px-4 py-3 text-sm font-bold text-[#1b3022]">
            Creating for {formatCalendarDateLabel(selectedDraftDate)}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-[1.4fr_220px_220px]">
          <input name="title" placeholder="Event title" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <select name="event_type" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            {calendarEventTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Publish now</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <select name="audience" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            {calendarAudiences.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="exam_category" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">General event</option>
            {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input name="starts_at" type="datetime-local" defaultValue={draftStartsAtValue} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <input name="ends_at" type="datetime-local" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select name="is_all_day" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="yes">All day</option>
            <option value="no">Timed event</option>
          </select>
          <input name="location" placeholder="Location (optional)" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <select name="source_post_id" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="">No related post</option>
            {relatedPosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title} ({typeLabel(post.type)})
              </option>
            ))}
          </select>
        </div>

        <input name="summary" placeholder="Short summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="link_url" placeholder="External link (optional)" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <textarea name="description" placeholder="Event description" className="min-h-32 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
        <PendingSubmitButton idleLabel="Create Event" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" />
      </form>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <details key={event.id} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-[#1b3022]">{event.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#6d7c6c]">
                    {typeLabel(event.event_type)} · {event.status} · {event.exam_category || "General"}
                  </p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">
                  {new Date(event.starts_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </summary>

              <form action={updateCalendarEventAction} className="mt-4 grid gap-3 border-t border-[#e4eae0] pt-4">
                <input type="hidden" name="event_id" value={event.id} />
                <div className="grid gap-3 md:grid-cols-[1.4fr_220px_220px]">
                  <input name="title" defaultValue={event.title} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                  <select name="event_type" defaultValue={event.event_type} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    {calendarEventTypes.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select name="status" defaultValue={event.status} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    {calendarEventStatuses.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <select name="audience" defaultValue={event.audience} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    {calendarAudiences.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select name="exam_category" defaultValue={event.exam_category ?? ""} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    <option value="">General event</option>
                    {["SSC", "UPSSC", "PSC", "UPSC", "BANKING", "RAILWAY"].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <input name="starts_at" type="datetime-local" defaultValue={formatDateTimeInput(event.starts_at)} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                  <input name="ends_at" type="datetime-local" defaultValue={formatDateTimeInput(event.ends_at)} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <select name="is_all_day" defaultValue={event.is_all_day ? "yes" : "no"} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    <option value="yes">All day</option>
                    <option value="no">Timed event</option>
                  </select>
                  <input name="location" defaultValue={event.location ?? ""} placeholder="Location" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                  <select name="source_post_id" defaultValue={event.source_post_id ?? ""} className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
                    <option value="">No related post</option>
                    {relatedPosts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title} ({typeLabel(post.type)})
                      </option>
                    ))}
                  </select>
                </div>

                <input name="summary" defaultValue={event.summary ?? ""} placeholder="Short summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                <input name="link_url" defaultValue={event.link_url ?? ""} placeholder="External link" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
                <textarea name="description" defaultValue={event.description} className="min-h-28 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
                <div className="flex flex-wrap items-center gap-3">
                  <PendingSubmitButton idleLabel="Save Event" pendingLabel="Saving..." className="rounded-2xl bg-[#1b3022] px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white" />
                </div>
              </form>

              <form action={deleteCalendarEventAction} className="mt-3">
                <input type="hidden" name="event_id" value={event.id} />
                <PendingSubmitButton idleLabel="Delete Event" pendingLabel="Deleting..." className="rounded-2xl border border-red-200 px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-red-700" />
              </form>
            </details>
          ))
        ) : (
          <div className="rounded-[1.8rem] border border-[#d8e0d4] bg-white px-5 py-8 text-sm font-semibold text-[#6d7c6c] shadow-lg shadow-[#27452e]/6">
            No calendar events yet.
          </div>
        )}
      </div>
    </div>
  );
}
