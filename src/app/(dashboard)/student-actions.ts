"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { notifyProfileIds, notifyReader } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { getISTDate, getISTTimestamp } from "@/lib/date-utils";
import { normalizeRole, type AppRole } from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  getNumber,
  getIsoDateTime,
  getIsoDateOnly,
  addDays,
  successState,
  errorState,
  revalidateSupportPaths,
  revalidateStudentCalendarPaths,
  STUDENT_CALENDAR_ENTRY_TYPES,
  STUDENT_CALENDAR_ENTRY_STATUSES,
  type SimpleActionState,
  type CalendarActionState,
  type CalendarFieldErrors,
} from "./actions-utils";

async function requireRole(allowedRoles: AppRole[]) {
  return requireDashboardContext(allowedRoles);
}

async function getStaffAndAdminProfileIds() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("profiles").select("id, role").in("role", ["super_admin", "staff"]);
  return (data ?? [])
    .filter((profile) => {
      const role = normalizeRole(profile.role);
      return role === "super_admin" || role === "staff";
    })
    .map((profile) => profile.id);
}

export async function createTodoItemAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const title = getString(formData, "title");
  const dueDate = getOptionalString(formData, "due_date");
  if (!title) return;

  const supabase = createAdminClient();
  await supabase.from("todo_items").insert({
    reader_id: student.id,
    title,
    due_date: dueDate,
  });

  revalidatePath("/student");
}

export async function toggleTodoItemAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const todoId = getString(formData, "todo_id");
  const completed = getString(formData, "completed") === "true";

  await supabase.from("todo_items").update({ is_completed: !completed }).eq("id", todoId).eq("reader_id", student.id);

  revalidatePath("/student");
}

export async function deleteTodoItemAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const todoId = getString(formData, "todo_id");
  if (!todoId) return;

  await supabase.from("todo_items").delete().eq("id", todoId).eq("reader_id", student.id);

  revalidatePath("/student");
}

export async function toggleSavedPostAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const shouldSave = getString(formData, "save") !== "no";
  if (!postId) return;

  const { data: post } = await supabase.from("posts").select("id, status").eq("id", postId).maybeSingle();
  if (!post || post.status !== "published") return;

  await supabase.from("student_post_activity").upsert({
    reader_id: student.id,
    post_id: postId,
    is_saved: shouldSave,
  }, { onConflict: "reader_id,post_id" });

  revalidatePath("/student");
  revalidatePath("/student/resources");
}

export async function updatePostRevisionAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const mode = getString(formData, "mode");
  if (!postId || !["revised", "needs_revision"].includes(mode)) return;

  const { data: post } = await supabase.from("posts").select("id, status").eq("id", postId).maybeSingle();
  if (!post || post.status !== "published") return;

  const now = getISTDate();
  await supabase.from("student_post_activity").upsert({
    reader_id: student.id,
    post_id: postId,
    is_saved: true,
    is_revised: mode === "revised",
    revised_at: mode === "revised" ? getISTTimestamp() : null,
    revision_due_on: mode === "revised" ? getIsoDateOnly(addDays(now, 7)) : getIsoDateOnly(now),
  }, { onConflict: "reader_id,post_id" });

  revalidatePath("/student/resources");
}

export async function logStudySessionAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const presetName = getString(formData, "preset_name");
  const focusMinutes = Math.max(1, Math.round(getNumber(formData, "focus_minutes", 25)));
  const breakMinutes = Math.max(1, Math.round(getNumber(formData, "break_minutes", 5)));
  const completedFocusBlocks = Math.max(0, Math.round(getNumber(formData, "completed_focus_blocks", 1)));
  const startedAt = getIsoDateTime(getString(formData, "started_at"));
  const endedAt = getIsoDateTime(getOptionalString(formData, "ended_at"));
  const source = getString(formData, "source") || "portal_timer";

  if (!presetName || !startedAt) return;

  await supabase.from("study_sessions").insert({
    reader_id: student.id,
    preset_name: presetName,
    focus_minutes: focusMinutes,
    break_minutes: breakMinutes,
    completed_focus_blocks: completedFocusBlocks,
    started_at: startedAt,
    ended_at: endedAt,
    source,
  });

  revalidatePath("/student/study");
}

export async function markNotificationReadAction(formData: FormData) {
  const { student, profile } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const notificationId = getString(formData, "notification_id");
  if (!notificationId) return;

  const { data: notification } = await supabase.from("notifications").select("id, audience_type, audience_id, metadata").eq("id", notificationId).maybeSingle();
  if (!notification) return;

  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;
  const isForStudent =
    (notification.audience_type === "reader" && notification.audience_id === student.id) ||
    (notification.audience_type === "profile" && notification.audience_id === profile.id) ||
    (notification.audience_type === "broadcast_role" && metadata.role === "student");

  if (!isForStudent) return;

  await supabase.from("notification_reads").upsert({
    notification_id: notificationId,
    profile_id: profile.id,
    read_at: getISTTimestamp(),
  }, { onConflict: "notification_id,profile_id" });

  revalidatePath("/student");
  revalidatePath("/student/notifications");
}

export async function markAllNotificationsReadAction() {
  const { student, profile } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, audience_type, audience_id, metadata")
    .or(`audience_id.eq.${student.id},audience_id.eq.${profile.id},audience_type.eq.broadcast_role`)
    .order("created_at", { ascending: false });

  const eligibleIds = (notifications ?? [])
    .filter((n) => {
      const metadata = (n.metadata ?? {}) as Record<string, unknown>;
      return (
        (n.audience_type === "reader" && n.audience_id === student.id) ||
        (n.audience_type === "profile" && n.audience_id === profile.id) ||
        (n.audience_type === "broadcast_role" && metadata.role === "student")
      );
    })
    .map((n) => n.id);

  if (eligibleIds.length > 0) {
    await supabase.from("notification_reads").upsert(
      eligibleIds.map((notificationId) => ({
        notification_id: notificationId,
        profile_id: profile.id,
        read_at: getISTTimestamp(),
      })),
      { onConflict: "notification_id,profile_id" }
    );
  }

  revalidatePath("/student");
  revalidatePath("/student/notifications");
}

export async function startNightLogAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const plannedExit = getString(formData, "planned_exit_time");
  if (!plannedExit) return;

  const nowIso = getISTTimestamp();
  const plannedExitIso = new Date(plannedExit).toISOString();

  const { data: existingActive } = await supabase.from("night_logs").select("id").eq("reader_id", student.id).eq("status", "active").maybeSingle();
  if (existingActive) return;

  await supabase.from("night_logs").insert({
    reader_id: student.id,
    seat_id: student.fixed_seat_id,
    entry_time: nowIso,
    planned_exit_time: plannedExitIso,
    status: "active",
  });

  revalidatePath("/student");
}

export async function endNightLogAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const nightLogId = getString(formData, "night_log_id");
  if (!nightLogId) return;

  const { data: nightLog } = await supabase.from("night_logs").select("id, reader_id, planned_exit_time").eq("id", nightLogId).eq("reader_id", student.id).maybeSingle();
  if (!nightLog) return;

  const now = getISTDate();
  const plannedExit = new Date(nightLog.planned_exit_time);
  const status = now > plannedExit ? "late" : "completed";

  await supabase.from("night_logs").update({
    actual_exit_time: getISTTimestamp(),
    status,
  }).eq("id", nightLog.id);

  revalidatePath("/student");
}

export async function submitStudentFeedbackAction(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return errorState("Your session expired. Please sign in again.");

  const supabase = createAdminClient();
  const subject = getString(formData, "subject");
  const message = getString(formData, "message");
  const category = getString(formData, "category") || "general";
  if (!subject || !message) {
    return errorState("Add both a subject and a description so staff can help you.");
  }

  await supabase.from("student_support_tickets").insert({
    reader_id: student.id,
    subject,
    message,
    category,
    status: "open",
    last_reply_at: getISTTimestamp(),
  });

  const sideEffects = [];

  getStaffAndAdminProfileIds().then(profileIds => {
    sideEffects.push(notifyProfileIds(profileIds, {
      category: "account",
      title: `Support ticket: ${subject}`,
      body: `${student.name}: ${message}`,
      link: "/staff/support",
    }));
  });

  getHubSettings().then(settings => {
    if (settings.enquiry_notification_emails.length > 0) {
      sideEffects.push(sendEmail({
        to: settings.enquiry_notification_emails,
        subject: `Student support ticket: ${subject}`,
        html: `<p><strong>Student:</strong> ${student.name} (${student.email ?? "no-email"})</p><p>${message}</p>`,
      }));
    }
  });

  sideEffects.push(notifyReader(student.id, {
    category: "account",
    title: "Support ticket received",
    body: "Your issue has been logged. Track its status from your dashboard.",
    link: "/student",
  }));

  await Promise.allSettled(sideEffects);

  revalidateSupportPaths();
  return successState("Your support request has been received. Staff will review it shortly.");
}

export async function createStudentCalendarEntryAction(
  _prevState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return { status: "error", message: "Your session expired. Please sign in again.", fieldErrors: {} };

  const supabase = createAdminClient();
  const title = getString(formData, "title");
  const notes = getOptionalString(formData, "notes") ?? "";
  const entryType = getString(formData, "entry_type") || "goal";
  const status = getString(formData, "status") || "planned";
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const fieldErrors: CalendarFieldErrors = {};

  if (!title) fieldErrors.title = "Enter a title for this planner item.";
  if (!startsAt) fieldErrors.starts_at = "Choose a valid start date and time.";
  if (endsAt && startsAt && new Date(endsAt) < new Date(startsAt)) {
    fieldErrors.ends_at = "End time must be later than the start time.";
  }
  if (!STUDENT_CALENDAR_ENTRY_TYPES.has(entryType) || !STUDENT_CALENDAR_ENTRY_STATUSES.has(status)) {
    return { status: "error", message: "Pick a valid planner type and status.", fieldErrors };
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted calendar fields.", fieldErrors };
  }

  await supabase.from("student_calendar_entries").insert({
    reader_id: student.id,
    title,
    notes,
    entry_type: entryType,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    is_all_day: isAllDay,
  });

  revalidateStudentCalendarPaths();
  return { status: "success", message: "Planner item saved.", fieldErrors: {} };
}

export async function updateStudentCalendarEntryAction(
  _prevState: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return { status: "error", message: "Your session expired. Please sign in again.", fieldErrors: {} };

  const supabase = createAdminClient();
  const entryId = getString(formData, "entry_id");
  const title = getString(formData, "title");
  const notes = getOptionalString(formData, "notes") ?? "";
  const entryType = getString(formData, "entry_type") || "goal";
  const status = getString(formData, "status") || "planned";
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const fieldErrors: CalendarFieldErrors = {};

  if (!title) fieldErrors.title = "Enter a title for this planner item.";
  if (!startsAt) fieldErrors.starts_at = "Choose a valid start date and time.";
  if (endsAt && startsAt && new Date(endsAt) < new Date(startsAt)) {
    fieldErrors.ends_at = "End time must be later than the start time.";
  }
  if (!entryId) {
    return { status: "error", message: "This planner item could not be found.", fieldErrors };
  }
  if (!STUDENT_CALENDAR_ENTRY_TYPES.has(entryType) || !STUDENT_CALENDAR_ENTRY_STATUSES.has(status)) {
    return { status: "error", message: "Pick a valid planner type and status.", fieldErrors };
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted calendar fields.", fieldErrors };
  }

  await supabase
    .from("student_calendar_entries")
    .update({
      title,
      notes,
      entry_type: entryType,
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      is_all_day: isAllDay,
    })
    .eq("id", entryId)
    .eq("reader_id", student.id);

  revalidateStudentCalendarPaths();
  return { status: "success", message: "Planner item updated.", fieldErrors: {} };
}

export async function deleteStudentCalendarEntryAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const entryId = getString(formData, "entry_id");
  if (!entryId) return;

  await supabase
    .from("student_calendar_entries")
    .delete()
    .eq("id", entryId)
    .eq("reader_id", student.id);

  revalidateStudentCalendarPaths();
}
