/**
 * Centralized utility for Indian Standard Time (IST) date handling.
 * We use Intl.DateTimeFormat to ensure accuracy regardless of server timezone.
 */

/**
 * Returns a new Date object representing the current time in IST wall-clock.
 * WARNING: This date object's UTC components match the IST local time.
 * Use this ONLY for display or local wall-clock comparisons (like getHours).
 * For true time comparisons, use the standard Date object or getISTTimestamp().
 */
export function getISTDate(date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, number> = {};
  parts.forEach(({ type, value }) => {
    if (type !== "literal") map[type] = parseInt(value, 10);
  });

  // Create a date that LOOKS like IST but is technically UTC
  return new Date(Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second));
}

/**
 * Returns YYYY-MM-DD string for the current IST date.
 */
export function getISTDateString(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Returns the current TRUE UTC timestamp.
 * We should store TRUE UTC in the DB and only format to IST on display.
 */
export function getISTTimestamp(date = new Date()): string {
  return date.toISOString();
}

/**
 * Formats a UTC string/date to a human-readable IST string.
 */
export function formatToIST(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Returns a short time string (HH:MM AM/PM) in IST.
 */
export function formatTimeIST(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Returns the Monday of the current IST week.
 */
export function getISTMonday(date = new Date()): Date {
  const ist = getISTDate(date);
  const day = ist.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(ist);
  monday.setUTCDate(ist.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Returns the current hour in IST (0-23).
 */
export function getISTHour(date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  return parseInt(formatter.format(date), 10);
}

/**
 * Returns the UTC ISO string for the start of the current day in IST (00:00:00 IST).
 */
export function getISTStartOfDay(date = new Date()): string {
  const istDateString = getISTDateString(date); // YYYY-MM-DD
  const d = new Date(`${istDateString}T00:00:00Z`);
  d.setMinutes(d.getMinutes() - 330);
  return d.toISOString();
}

/**
 * Returns the current year in IST.
 */
export function getISTYear(date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  });
  return parseInt(formatter.format(date), 10);
}

/**
 * Returns the current month (1-12) in IST.
 */
export function getISTMonth(date = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
  });
  return parseInt(formatter.format(date), 10);
}




/**
 * Parses an IST wall-clock string (like YYYY-MM-DDTHH:mm from a datetime-local input)
 * and returns the true UTC ISO string.
 */
export function parseISTToUTC(istString: string): string {
  if (!istString) return new Date().toISOString();
  // If it already has a timezone, just return it as ISO
  if (istString.includes("+") || istString.endsWith("Z")) {
    return new Date(istString).toISOString();
  }
  // Assume it's an India wall-clock string
  // If it's just a time like "08:00", we need to prepend today's date
  let fullString = istString;
  if (!istString.includes("T")) {
    fullString = `${getISTDateString()}T${istString}`;
  }
  // Ensure we have seconds
  if (fullString.split(":").length === 2) {
    fullString = `${fullString}:00`;
  }
  return new Date(`${fullString}+05:30`).toISOString();
}
