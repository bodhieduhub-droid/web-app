import { revalidatePath } from "next/cache";
import { type PlanType } from "@/lib/billing-utils";
import { getISTDate } from "@/lib/date-utils";

export type SimpleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type PaymentProofActionState = SimpleActionState & {
  billId: string | null;
};

export type CalendarFieldErrors = Partial<Record<"title" | "starts_at" | "ends_at", string>>;

export type CalendarActionState = SimpleActionState & {
  fieldErrors: CalendarFieldErrors;
};

export function successState(message: string): SimpleActionState {
  return { status: "success", message };
}

export function errorState(message: string): SimpleActionState {
  return { status: "error", message };
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

export function getNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

export function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (!value) return null;
  // Handle standard File objects and duck-typed file-like objects from FormData
  if (typeof value === "object" && "size" in value && "name" in value) {
    return (value as any).size > 0 ? (value as File) : null;
  }
  return null;
}

export function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function getIsoDateTime(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getIsoDateOnly(date = getISTDate()) {
  return date.toISOString().slice(0, 10);
}

export function getMondayOfCurrentWeek(date = getISTDate()) {
  const monday = new Date(date);
  const day = monday.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function normalizePlanType(value: string): PlanType {
  if (value === "daily" || value === "weekly" || value === "monthly") return value;
  return "monthly";
}

export function planDefaultPrice(
  planType: PlanType,
  settings: { daily_price: number; weekly_price: number; default_monthly_price: number },
) {
  if (planType === "daily") return Number(settings.daily_price) || 150;
  if (planType === "weekly") return Number(settings.weekly_price) || 650;
  return Number(settings.default_monthly_price) || 1650;
}

export function formatPlanLabel(planType: PlanType) {
  if (planType === "daily") return "Daily";
  if (planType === "weekly") return "Weekly";
  return "Monthly";
}

export function revalidateCalendarPaths() {
  revalidatePath("/student");
  revalidatePath("/student/calendar");
  revalidatePath("/staff/content");
  revalidatePath("/staff/content/calendar");
  revalidatePath("/super-admin/content");
  revalidatePath("/super-admin/content/calendar");
}

export function revalidateStudentCalendarPaths() {
  revalidatePath("/student");
  revalidatePath("/student/calendar");
}

export function revalidateSupportPaths() {
  revalidatePath("/student");
  revalidatePath("/staff");
  revalidatePath("/staff/support");
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/support");
}

export const CALENDAR_EVENT_TYPES = new Set([
  "exam_deadline",
  "exam_date",
  "admit_card",
  "result",
  "hub_event",
  "holiday",
  "other",
]);

export const CALENDAR_EVENT_STATUSES = new Set(["draft", "published", "archived"]);
export const CALENDAR_EVENT_AUDIENCES = new Set(["student", "public"]);
export const STUDENT_CALENDAR_ENTRY_TYPES = new Set(["goal", "personal_event", "reminder"]);
export const STUDENT_CALENDAR_ENTRY_STATUSES = new Set(["planned", "completed", "cancelled"]);
export const SUPPORT_TICKET_STATUSES = new Set(["open", "in_review", "resolved", "closed"]);
