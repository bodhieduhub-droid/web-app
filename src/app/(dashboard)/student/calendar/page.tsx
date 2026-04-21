import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, Target } from "lucide-react";

import { CalendarMonthGrid } from "@/components/calendar/month-grid";
import { CalendarAddForm } from "@/components/student/calendar-add-form";
import { CalendarManageItem } from "@/components/student/calendar-manage-item";
import type { StudentCalendarEntryRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import {
  addMonths,
  type CalendarGridItem,
  type CalendarRangeItem,
  endOfDay,
  endOfMonth,
  endOfWeek,
  eventIntersectsRange,
  eventOccursOnDay,
  formatCalendarDateLabel,
  formatCalendarMonthLabel,
  formatDayParam,
  formatMonthParam,
  getCalendarGridDays,
  isSameMonth,
  parseDayParam,
  parseMonthParam,
  startOfDay,
  startOfMonth,
} from "@/lib/calendar-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const viewOptions = [
  ["month", "Month"],
  ["today", "Today"],
  ["week", "This Week"],
  ["upcoming", "Upcoming"],
] as const;

const plannerEntryTypes = [
  ["goal", "Goal"],
  ["personal_event", "Event"],
  ["reminder", "Reminder"],
] as const;

const plannerStatuses = [
  ["planned", "Planned"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

type PlannerItem = CalendarGridItem & {
  notes: string;
  entry_type: StudentCalendarEntryRecord["entry_type"];
  status: StudentCalendarEntryRecord["status"];
};

function matchesAgendaView(item: CalendarRangeItem, view: string, now: Date) {
  const startsAt = new Date(item.starts_at);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (view === "today") return startsAt >= todayStart && startsAt <= todayEnd;
  if (view === "week") return startsAt >= todayStart && startsAt <= endOfWeek(now);
  if (view === "upcoming") return startsAt >= now;
  return eventIntersectsRange(item, startOfMonth(now), endOfMonth(now));
}

function formatItemTiming(item: CalendarRangeItem) {
  const start = new Date(item.starts_at);
  if (item.is_all_day) {
    return start.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const startLabel = start.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!item.ends_at) return startLabel;

  const end = new Date(item.ends_at);
  const endLabel = end.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startLabel} - ${endLabel}`;
}

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function formatSelectedDateDefault(date: Date) {
  const draft = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0, 0, 0);
  return formatDateTimeInput(draft.toISOString());
}

function labelFromValue(value: string) {
  return value.replaceAll("_", " ");
}

function plannerChipClass(entry: StudentCalendarEntryRecord) {
  if (entry.status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (entry.status === "cancelled") return "border-slate-200 bg-slate-100 text-slate-700";
  if (entry.entry_type === "goal") return "border-[#d4dfcb] bg-[#eef3ea] text-[#1b3022]";
  if (entry.entry_type === "personal_event") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function toPlannerItem(entry: StudentCalendarEntryRecord): PlannerItem {
  return {
    id: entry.id,
    title: entry.title,
    starts_at: entry.starts_at,
    ends_at: entry.ends_at,
    is_all_day: entry.is_all_day,
    chipClassName: plannerChipClass(entry),
    notes: entry.notes,
    entry_type: entry.entry_type,
    status: entry.status,
  };
}

function groupedAgenda(items: PlannerItem[]) {
  return items.reduce<Record<string, PlannerItem[]>>((acc, item) => {
    const key = new Date(item.starts_at).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function buildViewHref(view: string, monthDate: Date, selectedDate: Date) {
  const params = new URLSearchParams({ view });

  if (view === "month") {
    params.set("month", formatMonthParam(monthDate));
    params.set("date", formatDayParam(selectedDate));
  }

  return `/student/calendar?${params.toString()}`;
}

function buildMonthPanelHref(panel: string, monthDate: Date, selectedDate: Date) {
  const params = new URLSearchParams({
    view: "month",
    month: formatMonthParam(monthDate),
    date: formatDayParam(selectedDate),
    panel,
  });

  return `/student/calendar?${params.toString()}`;
}

function plannerBadgeClasses(item: PlannerItem) {
  if (item.status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (item.status === "cancelled") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-[#d4dfcb] bg-[#eef3ea] text-[#1b3022]";
}

export default async function StudentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; date?: string; panel?: string }>;
}) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return null;

  const supabase = createAdminClient();
  const { view: rawView, month: rawMonth, date: rawDate, panel: rawPanel } = await searchParams;
  const now = new Date();
  const requestedDate = parseDayParam(rawDate);
  const monthDate = parseMonthParam(rawMonth, requestedDate ?? now);
  const view = viewOptions.some(([value]) => value === rawView) ? rawView! : "month";
  const panel = rawPanel === "add" || rawPanel === "manage" ? rawPanel : "overview";
  const fallbackSelectedDate = isSameMonth(now, monthDate) ? startOfDay(now) : startOfMonth(monthDate);
  const selectedDate = requestedDate && isSameMonth(requestedDate, monthDate) ? requestedDate : fallbackSelectedDate;

  const { data: entries } = await supabase
    .from("student_calendar_entries")
    .select("*")
    .eq("reader_id", student.id)
    .order("starts_at", { ascending: true })
    .limit(180);

  const plannerEntries = (entries ?? []) as StudentCalendarEntryRecord[];
  const plannerItems = plannerEntries.map(toPlannerItem);
  const gridDays = getCalendarGridDays(monthDate);
  const gridStart = startOfDay(gridDays[0]);
  const gridEnd = endOfDay(gridDays[gridDays.length - 1]);
  const monthItems = plannerItems.filter((item) => eventIntersectsRange(item, gridStart, gridEnd));
  const selectedDateItems = monthItems.filter((item) => eventOccursOnDay(item, selectedDate));
  const agendaItems = plannerItems.filter((item) => matchesAgendaView(item, view, now));
  const groupedItems = groupedAgenda(agendaItems);
  const previousMonth = addMonths(monthDate, -1);
  const nextMonth = addMonths(monthDate, 1);
  const plannerDefaultStart = formatSelectedDateDefault(selectedDate);
  const plannedCount = plannerEntries.filter((entry) => entry.status === "planned").length;
  const completedCount = plannerEntries.filter((entry) => entry.status === "completed").length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[2rem] bg-[#1b3022] p-5 text-white shadow-2xl shadow-[#1b3022]/15 sm:p-7 lg:rounded-[2.4rem] lg:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/50 sm:text-[11px]">My Calendar</p>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">Goals, Events, And Reminders</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/80 sm:text-base sm:leading-7">
          This calendar belongs to the student. Add your own study goals, mock tests, revision reminders, personal events, and daily plans without depending on staff updates.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total Items", value: plannerEntries.length },
            { label: "Planned", value: plannedCount },
            { label: "Completed", value: completedCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{stat.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-2 sm:gap-3">
        {viewOptions.map(([value, label]) => {
          const active = value === view;
          return (
            <Link
              key={value}
              href={buildViewHref(value, monthDate, selectedDate)}
              prefetch={false}
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition sm:text-sm ${
                active ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] bg-white text-[#536352]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </section>

      {view === "month" ? (
        <div className="space-y-6">
          <section className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c] sm:text-[11px]">Month Navigation</p>
                <h2 className="mt-2 text-2xl font-black text-[#1b3022] sm:text-3xl">{formatCalendarMonthLabel(monthDate)}</h2>
                <p className="mt-2 text-sm font-semibold text-[#536352]">
                  Selected day: {formatCalendarDateLabel(selectedDate)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/student/calendar?view=month&month=${formatMonthParam(previousMonth)}`}
                    prefetch={false}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1b3022] sm:flex-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Link>
                  <Link
                    href={`/student/calendar?view=month&month=${formatMonthParam(nextMonth)}`}
                    prefetch={false}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#1b3022] sm:flex-none"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <form method="get" className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="view" value="month" />
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
            events={monthItems}
            monthDate={monthDate}
            selectedDate={selectedDate}
            title="Month View"
            subtitle="Tap a day to review it. Add new items from the floating button, then use the planner panel only when you need to create or edit entries."
            dayHref={(day) => `/student/calendar?view=month&month=${formatMonthParam(monthDate)}&date=${formatDayParam(day)}`}
          />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <section className="space-y-6">
              <div className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c] sm:text-[11px]">Selected Day</p>
                    <h2 className="mt-2 text-2xl font-black text-[#1b3022]">{formatCalendarDateLabel(selectedDate)}</h2>
                  </div>
                  <span className="rounded-full bg-[#eef3ea] px-3 py-1 text-xs font-black text-[#536352]">
                    {selectedDateItems.length} item{selectedDateItems.length === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedDateItems.length === 0 ? (
                  <div className="mt-5 rounded-[1.6rem] border border-dashed border-[#d8e0d4] bg-[#f7faf5] p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm">
                      <Target className="h-7 w-7 text-[#6d7c6c]" />
                    </div>
                    <p className="mt-4 text-lg font-black text-[#1b3022]">Nothing planned for this day</p>
                    <p className="mt-2 text-sm font-medium text-[#536352]">
                      Add your first goal or event from the form, or tap another day in the calendar.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {selectedDateItems.map((item) => (
                      <article key={`${item.id}-${formatDayParam(selectedDate)}`} className="rounded-[1.6rem] border border-[#d8e0d4] bg-[#fbfcfa] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-[#1b3022]">{item.title}</p>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">
                              {labelFromValue(item.entry_type)} · {labelFromValue(item.status)}
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${plannerBadgeClasses(item)}`}>
                            {item.is_all_day ? "All Day" : "Timed"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm font-semibold text-[#1b3022]">
                          <p className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-[#6d7c6c]" />
                            {formatItemTiming(item)}
                          </p>
                        </div>

                        {item.notes ? (
                          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{item.notes}</p>
                        ) : (
                          <p className="mt-4 text-sm font-medium text-[#8a9d88]">No notes added yet.</p>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <section className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#536352]">Planner panel</p>
                    <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Add or manage items</h2>
                  </div>
                  <span className="rounded-full bg-[#eef3ea] px-3 py-1 text-sm font-semibold text-[#536352]">
                    {plannerEntries.length} total
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-[1.6rem] bg-[#f5f8f3] p-2">
                  {[
                    ["overview", "Overview"],
                    ["add", "Add"],
                    ["manage", "Manage"],
                  ].map(([value, label]) => {
                    const active = panel === value;
                    return (
                      <Link
                        key={value}
                        href={buildMonthPanelHref(value, monthDate, selectedDate)}
                        prefetch={false}
                        className={`rounded-2xl px-3 py-2 text-center text-sm font-semibold transition ${
                          active ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/15" : "text-[#536352]"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>

                {panel === "overview" ? (
                  <div className="mt-5 rounded-[1.6rem] border border-dashed border-[#d8e0d4] bg-[#fbfcfa] p-5">
                    <p className="text-lg font-black text-[#1b3022]">Keep the month grid in focus</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-[#536352]">
                      Use the day view on the left to scan your schedule. Open Add only when you need a new item, and Manage only when you want to edit older plans.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={buildMonthPanelHref("add", monthDate, selectedDate)}
                        prefetch={false}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1b3022] px-4 py-3 text-sm font-semibold text-white"
                      >
                        <Plus className="h-4 w-4" />
                        Add planner item
                      </Link>
                      <Link
                        href={buildMonthPanelHref("manage", monthDate, selectedDate)}
                        prefetch={false}
                        className="rounded-2xl border border-[#d8e0d4] px-4 py-3 text-sm font-semibold text-[#1b3022]"
                      >
                        Manage existing items
                      </Link>
                    </div>
                  </div>
                ) : null}

                {panel === "add" ? (
                  <div className="mt-5">
                    <CalendarAddForm
                      defaultStartsAt={plannerDefaultStart}
                      plannerEntryTypes={plannerEntryTypes}
                      plannerStatuses={plannerStatuses}
                    />
                  </div>
                ) : null}

                {panel === "manage" ? (
                  plannerEntries.length === 0 ? (
                    <div className="mt-5 rounded-[1.6rem] border border-dashed border-[#d8e0d4] bg-[#f7faf5] p-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm">
                        <CalendarDays className="h-7 w-7 text-[#6d7c6c]" />
                      </div>
                      <p className="mt-4 text-lg font-black text-[#1b3022]">Your planner is empty</p>
                      <p className="mt-2 text-sm font-medium text-[#536352]">
                        Add a goal, reminder, or event to start using the calendar.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {plannerEntries.map((entry) => (
                        <CalendarManageItem
                          key={entry.id}
                          entry={entry}
                          plannerEntryTypes={plannerEntryTypes}
                          plannerStatuses={plannerStatuses}
                          chipClassName={plannerChipClass(entry)}
                        />
                      ))}
                    </div>
                  )
                ) : null}
              </section>
            </aside>
          </section>

          <Link
            href={buildMonthPanelHref("add", monthDate, selectedDate)}
            prefetch={false}
            className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-[#1b3022] px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-[#1b3022]/25 xl:hidden"
          >
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </div>
      ) : agendaItems.length === 0 ? (
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-10 text-center shadow-lg shadow-[#27452e]/6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef3ea]">
            <CalendarDays className="h-8 w-8 text-[#6d7c6c]" />
          </div>
          <p className="mt-4 text-lg font-black text-[#1b3022]">No planner items in this view</p>
          <p className="mt-2 text-sm font-medium text-[#536352]">
            Create a personal goal or reminder, then it will show up here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([label, dayItems]) => (
            <section key={label}>
              <div className="mb-4 flex items-center gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">{label}</p>
                <div className="flex-1 border-t border-[#d8e0d4]" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {dayItems.map((item) => (
                  <article key={item.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-[#1b3022]">{item.title}</p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">
                          {labelFromValue(item.entry_type)} · {labelFromValue(item.status)}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${plannerBadgeClasses(item)}`}>
                        {item.is_all_day ? "All Day" : "Timed"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm font-semibold text-[#1b3022]">
                      <p className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#6d7c6c]" />
                        {formatItemTiming(item)}
                      </p>
                    </div>

                    {item.notes ? (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{item.notes}</p>
                    ) : (
                      <p className="mt-4 text-sm font-medium text-[#8a9d88]">No notes added yet.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
