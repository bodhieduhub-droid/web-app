/**
 * Centralized utility for Indian Standard Time (IST) date handling.
 * Since Vercel servers run in UTC, we must explicitly shift to IST (+5:30).
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Returns a new Date object shifted to IST.
 * NOTE: Use this for wall-clock comparisons (e.g. .getHours())
 */
export function getISTDate(date = new Date()): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

/**
 * Returns YYYY-MM-DD string for the current IST date.
 */
export function getISTDateString(date = new Date()): string {
  const ist = getISTDate(date);
  return ist.toISOString().split("T")[0];
}

/**
 * Returns the current timestamp in ISO format but shifted to IST wall-clock.
 * Useful for storing in DB columns that don't auto-convert.
 */
export function getISTTimestamp(date = new Date()): string {
  return getISTDate(date).toISOString();
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
 * Returns the Monday of the current IST week.
 */
export function getISTMonday(date = getISTDate()): Date {
  const monday = new Date(date);
  const day = monday.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  monday.setUTCDate(monday.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

