import Link from "next/link";

import {
  buildDayEventMap,
  calendarWeekdayLabels,
  type CalendarGridItem,
  formatCalendarTimeLabel,
  formatDayParam,
  getCalendarGridDays,
  isSameDay,
  isSameMonth,
  getTodayIST,
} from "@/lib/calendar-utils";

function dayChipLabel(event: CalendarGridItem, day: Date) {
  if (event.is_all_day) {
    return isSameDay(new Date(event.starts_at), day) ? event.title : `Continues · ${event.title}`;
  }

  const eventStart = new Date(event.starts_at);
  const prefix = isSameDay(eventStart, day) ? formatCalendarTimeLabel(eventStart) : "Continues";
  return `${prefix} · ${event.title}`;
}

type CalendarMonthGridProps = {
  events: CalendarGridItem[];
  monthDate: Date;
  selectedDate?: Date | null;
  dayHref: (day: Date) => string;
  title?: string;
  subtitle?: string;
};

export function CalendarMonthGrid({
  events,
  monthDate,
  selectedDate = null,
  dayHref,
  title,
  subtitle,
}: CalendarMonthGridProps) {
  const visibleDays = getCalendarGridDays(monthDate);
  const dayEventMap = buildDayEventMap(events, visibleDays);
  const today = getTodayIST();

  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-[#d8e0d4] bg-white p-3 shadow-lg shadow-[#27452e]/6 sm:p-5 lg:rounded-[2rem] lg:p-6">
      {title || subtitle ? (
        <div className="mb-4 sm:mb-5">
          {title ? <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c] sm:text-[11px]">{title}</p> : null}
          {subtitle ? <p className="mt-2 text-sm font-semibold leading-6 text-[#536352]">{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-7 gap-1 border-b border-[#e4eae0] pb-2 sm:gap-2 sm:pb-3">
        {calendarWeekdayLabels.map((label) => (
          <p key={label} className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-[#8a9d88] sm:text-[11px] sm:tracking-[0.24em]">
            <span className="sm:hidden">{label.slice(0, 1)}</span>
            <span className="hidden sm:inline">{label}</span>
          </p>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:mt-3 sm:gap-2">
        {visibleDays.map((day) => {
          const dayKey = formatDayParam(day);
          const dayEvents = dayEventMap.get(dayKey) ?? [];
          const isCurrentMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <Link
              key={dayKey}
              href={dayHref(day)}
              prefetch={false}
              className={`group flex min-h-[4.85rem] flex-col rounded-[1rem] border p-1.5 transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[7.8rem] sm:rounded-[1.25rem] sm:p-2.5 lg:min-h-[9.5rem] ${
                isSelected
                  ? "border-[#1b3022] bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/12"
                  : isCurrentMonth
                    ? "border-[#d8e0d4] bg-[#fbfcfa] text-[#1b3022]"
                    : "border-[#e8ede5] bg-[#f4f6f1] text-[#a3aea1]"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black sm:h-8 sm:w-8 sm:text-sm ${
                    isSelected
                      ? "bg-white text-[#1b3022]"
                      : isToday
                        ? "bg-[#1b3022] text-white"
                        : "bg-white/80 text-inherit"
                  }`}
                >
                  {day.getDate()}
                </span>

                {dayEvents.length > 0 ? (
                  <span
                    className={`hidden rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] sm:inline-flex ${
                      isSelected ? "bg-white/15 text-white" : "bg-[#eef3ea] text-[#536352]"
                    }`}
                  >
                    {dayEvents.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={`${dayKey}-${event.id}`}
                    className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#6d7c6c]"}`}
                  />
                ))}
                {dayEvents.length > 3 ? (
                  <span className={`text-[9px] font-black ${isSelected ? "text-white/80" : "text-[#7a8879]"}`}>
                    +{dayEvents.length - 3}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 hidden space-y-1 sm:block">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={`${dayKey}-${event.id}`}
                    className={`truncate rounded-lg border px-2 py-1 text-[10px] font-black leading-4 lg:text-[11px] ${
                      isSelected ? "border-white/15 bg-white/10 text-white" : event.chipClassName
                    }`}
                    title={dayChipLabel(event, day)}
                  >
                    {dayChipLabel(event, day)}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <p className={`px-1 text-[10px] font-bold ${isSelected ? "text-white/75" : "text-[#7a8879]"}`}>
                    +{dayEvents.length - 2} more
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
