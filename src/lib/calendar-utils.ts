export type CalendarRangeItem = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  is_all_day: boolean;
};

export type CalendarGridItem = CalendarRangeItem & {
  chipClassName: string;
};

export const calendarWeekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function startOfWeek(date: Date) {
  const value = startOfDay(date);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

export function endOfWeek(date: Date) {
  const value = endOfDay(date);
  value.setDate(value.getDate() + (6 - value.getDay()));
  return value;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function formatMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDayParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseMonthParam(rawValue: string | null | undefined, fallback = new Date()) {
  if (!rawValue) return startOfMonth(fallback);

  const match = /^(\d{4})-(\d{2})$/.exec(rawValue);
  if (!match) return startOfMonth(fallback);

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return startOfMonth(fallback);
  }

  return new Date(year, monthIndex, 1);
}

export function parseDayParam(rawValue: string | null | undefined) {
  if (!rawValue) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawValue);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return null;
  }

  const value = new Date(year, monthIndex, day);
  if (
    value.getFullYear() !== year ||
    value.getMonth() !== monthIndex ||
    value.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(value);
}

export function formatCalendarMonthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function formatCalendarDateLabel(date: Date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCalendarTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCalendarGridDays(monthDate: Date) {
  const firstVisibleDay = startOfWeek(startOfMonth(monthDate));
  return Array.from({ length: 42 }, (_, index) => addDays(firstVisibleDay, index));
}

export function eventOccursOnDay(event: CalendarRangeItem, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const eventStart = new Date(event.starts_at);
  const eventEnd = event.ends_at ? new Date(event.ends_at) : eventStart;

  return eventStart <= dayEnd && eventEnd >= dayStart;
}

export function eventIntersectsRange(event: CalendarRangeItem, rangeStart: Date, rangeEnd: Date) {
  const eventStart = new Date(event.starts_at);
  const eventEnd = event.ends_at ? new Date(event.ends_at) : eventStart;
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

export function buildDayEventMap<T extends CalendarRangeItem>(events: T[], visibleDays: Date[]) {
  const keys = visibleDays.map((day) => formatDayParam(day));
  const dayMap = new Map(keys.map((key) => [key, [] as T[]]));

  if (visibleDays.length === 0) return dayMap;

  const rangeStart = startOfDay(visibleDays[0]);
  const rangeEnd = endOfDay(visibleDays[visibleDays.length - 1]);

  for (const event of events) {
    if (!eventIntersectsRange(event, rangeStart, rangeEnd)) continue;

    for (const day of visibleDays) {
      if (!eventOccursOnDay(event, day)) continue;
      dayMap.get(formatDayParam(day))?.push(event);
    }
  }

  for (const rows of dayMap.values()) {
    rows.sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  }

  return dayMap;
}
