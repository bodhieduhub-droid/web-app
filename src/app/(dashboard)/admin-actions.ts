"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { notifyProfileIds, notifyReader, createNotification } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { getISTDate, getISTDateString, getISTTimestamp } from "@/lib/date-utils";
import { randomBytes } from "crypto";
import { 
  normalizeRole,
  calculateMonthlyAdmissionAmount, 
  calculateInvoiceAmount, 
  isRegistrationFeeApplicable,
  type AppRole 
} from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  getNumber,
  getStringArray,
  getIsoDateOnly,
  successState,
  errorState,
  revalidateSupportPaths,
  SUPPORT_TICKET_STATUSES,
  normalizePlanType, 
  planDefaultPrice, 
  formatPlanLabel,
  type SimpleActionState,
} from "./actions-utils";

async function requireRole(allowedRoles: AppRole[]) {
  return requireDashboardContext(allowedRoles);
}

async function notifyActor(profileId: string, title: string, body: string, link?: string) {
  await createNotification({
    audienceType: "profile",
    audienceId: profileId,
    category: "account",
    title,
    body,
    link,
  });
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

export async function updateHubSettingsAction(formData: FormData) {
  await requireRole(["super_admin"]);
  const supabase = createAdminClient();

  const seatCapacity = getNumber(formData, "seat_capacity", 69);
  const dailyPrice = getNumber(formData, "daily_price", 150);
  const weeklyPrice = getNumber(formData, "weekly_price", 650);
  const monthlyPrice = getNumber(formData, "default_monthly_price", 1650);
  const registrationFee = getNumber(formData, "registration_fee", 400);
  const cautionDeposit = getNumber(formData, "caution_deposit", 300);
  const prorataPerDay = getNumber(formData, "per_day_prorata", 55);
  const desiredSeatCapacity = Math.max(1, Math.round(seatCapacity));

  const { data: existingSeats } = await supabase.from("seats").select("id, seat_number");
  const seatRows = existingSeats ?? [];
  const existingSeatCount = seatRows.length;
  const existingSeatNumbers = new Set(seatRows.map((row) => Number(row.seat_number)));
  const normalizedSeatCapacity = Math.max(desiredSeatCapacity, existingSeatCount);

  if (normalizedSeatCapacity > existingSeatCount) {
    const toInsert: Array<{ seat_number: number }> = [];
    for (let n = 1; n <= normalizedSeatCapacity; n += 1) {
      if (!existingSeatNumbers.has(n)) {
        toInsert.push({ seat_number: n });
      }
    }
    if (toInsert.length > 0) await supabase.from("seats").insert(toInsert);
  }

  await supabase.from("hub_settings").update({
    hub_name: getString(formData, "hub_name") || "Bodhi Edu Hub",
    active_vertical: getString(formData, "active_vertical") || "Reading Hub",
    seat_capacity: normalizedSeatCapacity,
    daily_price: Math.max(0, dailyPrice),
    weekly_price: Math.max(0, weeklyPrice),
    default_monthly_price: Math.max(0, monthlyPrice),
    registration_fee: Math.max(0, registrationFee),
    caution_deposit: Math.max(0, cautionDeposit),
    per_day_prorata: Math.max(0, prorataPerDay),
    static_upi_id: getOptionalString(formData, "static_upi_id"),
    static_upi_name: getOptionalString(formData, "static_upi_name"),
    static_upi_qr_url: getOptionalString(formData, "static_upi_qr_url"),
    enquiry_notification_emails: getString(formData, "enquiry_notification_emails").split(",").map((value) => value.trim()).filter(Boolean),
    billing_notification_emails: getString(formData, "billing_notification_emails").split(",").map((value) => value.trim()).filter(Boolean),
    allowed_attendance_ips: getString(formData, "allowed_attendance_ips").split(",").map((value) => value.trim()).filter(Boolean),
    updated_at: getISTTimestamp(),
  }).eq("id", 1);

  revalidatePath("/super-admin/settings");
  revalidatePath("/super-admin/seats");
  revalidatePath("/");
}

export async function resetAllDataAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const confirmation = getString(formData, "confirm").toLowerCase();

  if (confirmation !== "reset") return;

  await supabase.from("notifications").delete().not("id", "is", null);
  await supabase.from("student_support_tickets").delete().not("id", "is", null);
  await supabase.from("study_sessions").delete().not("id", "is", null);
  await supabase.from("student_post_activity").delete().not("id", "is", null);
  await supabase.from("student_calendar_entries").delete().not("id", "is", null);
  await supabase.from("todo_items").delete().not("id", "is", null);
  await supabase.from("calendar_events").delete().not("id", "is", null);
  await supabase.from("transactions").delete().not("id", "is", null);
  await supabase.from("bills").delete().not("id", "is", null);
  await supabase.from("student_exam_interests").delete().not("id", "is", null);
  await supabase.from("readers").delete().not("id", "is", null);
  await supabase.from("enquiries").delete().not("id", "is", null);
  await supabase.from("posts").delete().not("id", "is", null);

  await supabase.from("seats").update({
    status: "available",
    assigned_reader_id: null,
    blocked_by_profile_id: null,
    block_reason: null,
    blocked_until: null,
    linked_enquiry_id: null,
  }).not("id", "is", null);

  const { data: nonAdminProfiles } = await supabase.from("profiles").select("id").neq("role", "super_admin");
  const nonAdminIds = (nonAdminProfiles ?? []).map((p) => p.id).filter((id) => id !== profile.id);

  await supabase.from("profiles").delete().neq("role", "super_admin");

  for (const id of nonAdminIds) {
    await supabase.auth.admin.deleteUser(id);
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/settings");
  revalidatePath("/super-admin/students");
  revalidatePath("/super-admin/enquiries");
  revalidatePath("/super-admin/seats");
  revalidatePath("/super-admin/billing");
  revalidatePath("/");

  redirect("/super-admin/settings");
}

export async function createStaffAccountAction(formData: FormData) {
  await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const fullName = getString(formData, "full_name");
  const email = getString(formData, "email");
  const password = getString(formData, "password") || `Staff${randomBytes(4).toString("hex")}!`;

  if (!fullName || !email) return;

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  });

  if (error || !authData.user) return;

  await supabase.from("profiles").upsert({
    id: authData.user.id,
    full_name: fullName,
    role: "staff",
    onboarding_required: false,
  });

  const staffEmail = emailTemplates.staffAccount({ name: fullName, email, password });
  await sendEmail({
    to: [email], subject: staffEmail.subject, html: staffEmail.html, text: staffEmail.text,
  });

  revalidatePath("/super-admin/staff");
}

export async function updateStaffProfileAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const staffId = getString(formData, "staff_id");
  const fullName = getString(formData, "full_name");
  const role = getString(formData, "role");

  if (!staffId || !fullName) return;
  if (!["staff", "super_admin"].includes(role)) return;

  const { data: targetProfile } = await supabase.from("profiles").select("id, role").eq("id", staffId).maybeSingle();
  if (!targetProfile) return;

  if (profile.id === staffId && role !== "super_admin") return;

  await supabase.from("profiles").update({ full_name: fullName, role }).eq("id", staffId);

  await notifyActor(staffId, "Account updated", `Your profile was updated by admin. Role: ${role}.`, role === "super_admin" ? "/super-admin" : "/staff");

  revalidatePath("/super-admin/staff");
  revalidatePath(`/super-admin/staff/${staffId}`);
  revalidatePath("/super-admin");
}

export async function removeStaffAccountAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const staffId = getString(formData, "staff_id");
  if (!staffId) return;

  if (staffId === profile.id) return;

  const { data: targetProfile } = await supabase.from("profiles").select("id, role").eq("id", staffId).maybeSingle();
  if (!targetProfile || targetProfile.role !== "staff") return;

  await supabase.auth.admin.deleteUser(staffId);

  revalidatePath("/super-admin/staff");
  revalidatePath(`/super-admin/staff/${staffId}`);
  revalidatePath("/super-admin");
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const ticketId = getString(formData, "ticket_id");
  const status = getString(formData, "status");

  if (!ticketId || !SUPPORT_TICKET_STATUSES.has(status)) return;

  const { data: ticket } = await supabase.from("student_support_tickets").select("id, reader_id, subject, status").eq("id", ticketId).maybeSingle();
  if (!ticket) return;

  const now = getISTTimestamp();
  await supabase.from("student_support_tickets").update({
    status,
    last_reply_at: now,
    resolved_at: status === "resolved" || status === "closed" ? now : null,
  }).eq("id", ticketId);

  if (ticket.status !== status) {
    await notifyReader(ticket.reader_id, {
      category: "account", title: "Support ticket updated", body: `"${ticket.subject}" is now ${status.replaceAll("_", " ")}.`, link: "/student",
    });
  }

  revalidateSupportPaths();
}

export async function requestExitAction(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return errorState("Your session expired. Please sign in again.");

  const supabase = createAdminClient();
  const exitDate = getString(formData, "exit_date");
  if (!exitDate) return errorState("Choose an exit date before submitting this request.");

  const { data: existingExit } = await supabase.from("exit_requests").select("id").eq("reader_id", student.id).in("status", ["pending"]).maybeSingle();
  if (existingExit) return errorState("You already have a pending exit request.");

  await supabase.from("exit_requests").insert({
    reader_id: student.id, exit_date: exitDate, refund_eligible: student.caution_paid === true, status: "pending",
  });

  const profileIds = await getStaffAndAdminProfileIds();
  await notifyProfileIds(profileIds, {
    category: "account", title: "New Exit Request", body: `${student.name} requested an exit on ${exitDate}.`, link: "/staff/exit-requests",
  });

  revalidatePath("/student");
  revalidatePath("/super-admin/exit-requests");
  revalidatePath("/staff/exit-requests");
  return successState("Your exit request has been submitted. Staff will confirm the next steps.");
}

export async function processExitAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const exitRequestId = getString(formData, "exit_request_id");
  const adminNotes = getOptionalString(formData, "admin_notes");

  if (!exitRequestId) return;

  const { data: exitRequest } = await supabase.from("exit_requests").select("*, readers(*)").eq("id", exitRequestId).maybeSingle();
  if (!exitRequest || exitRequest.status !== "pending") return;

  const studentRecord = Array.isArray(exitRequest.readers) ? exitRequest.readers[0] : exitRequest.readers;
  const student = (studentRecord ?? null) as any;
  if (!student) return;

  const sideEffects = [];

  sideEffects.push(supabase.from("exit_requests").update({ status: "processed", admin_notes: adminNotes }).eq("id", exitRequestId).eq("status", "pending"));
  sideEffects.push(supabase.from("readers").update({ status: "archived", caution_refunded: exitRequest.refund_eligible ? true : student.caution_refunded }).eq("id", exitRequest.reader_id));

  if (student.fixed_seat_id) {
    sideEffects.push(supabase.from("seats").update({ status: "available", assigned_reader_id: null, blocked_by_profile_id: null, block_reason: null, linked_enquiry_id: null }).eq("id", student.fixed_seat_id));
  }

  if (exitRequest.refund_eligible && student.email) {
    const refundEmail = emailTemplates.cautionRefund({ name: student.name, amount: 300, method: "UPI / NEFT", processedAt: getISTDateString() });
    sideEffects.push(sendEmail({ to: [student.email], subject: refundEmail.subject, html: refundEmail.html, text: refundEmail.text }));
  }

  sideEffects.push(notifyReader(student.id, { category: "account", title: "Exit request processed", body: "Your exit has been processed, and seat has been released.", link: "/student/profile" }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/student");
  revalidatePath("/super-admin/exit-requests");
  revalidatePath(`/super-admin/exit-requests/${exitRequestId}`);
  revalidatePath("/staff/exit-requests");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function rejectExitAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const exitRequestId = getString(formData, "exit_request_id");
  const adminNotes = getOptionalString(formData, "admin_notes");
  
  if (!exitRequestId) return;
  if (!adminNotes) {
    await notifyActor(profile.id, "Exit rejection blocked", "Rejection reason is required.");
    return;
  }

  const { data: exitRequest } = await supabase.from("exit_requests").select("id, status, reader_id").eq("id", exitRequestId).maybeSingle();
  if (!exitRequest || exitRequest.status !== "pending") return;

  await supabase.from("exit_requests").update({ status: "rejected", admin_notes: adminNotes }).eq("id", exitRequestId).eq("status", "pending");

  await notifyReader(exitRequest.reader_id, {
    category: "account", title: "Exit request rejected", body: "Your exit request was rejected by admin. Contact staff for clarification.", link: "/student/profile",
  });

  revalidatePath("/student");
  revalidatePath("/super-admin/exit-requests");
  revalidatePath(`/super-admin/exit-requests/${exitRequestId}`);
  revalidatePath("/staff/exit-requests");
}

export async function rejoinStudentAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  if (!readerId) return;

  const { data: reader } = await supabase.from("readers").select("id, name, email, status, reader_type, caution_refunded, fixed_seat_id, monthly_fee, onboarding_completed, join_date").eq("id", readerId).maybeSingle();
  if (!reader) return;

  const { data: openBill } = await supabase.from("bills").select("id").eq("reader_id", reader.id).in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]).maybeSingle();

  let seatIdToAssign = reader.fixed_seat_id;
  if (seatIdToAssign) {
    const { data: existingSeat } = await supabase.from("seats").select("id, status").eq("id", seatIdToAssign).maybeSingle();
    if (!existingSeat || existingSeat.status !== "available") seatIdToAssign = null;
  }

  if (!seatIdToAssign) {
    const { data: nextSeat } = await supabase.from("seats").select("id").eq("status", "available").order("seat_number", { ascending: true }).limit(1).maybeSingle();
    if (!nextSeat) return;
    seatIdToAssign = nextSeat.id;
  }

  const sideEffects = [];

  sideEffects.push(supabase.from("seats").update({ status: "occupied", assigned_reader_id: reader.id, blocked_by_profile_id: null, block_reason: null, linked_enquiry_id: null }).eq("id", seatIdToAssign));

  sideEffects.push(supabase.from("readers").update({
    status: "pending_payment", fixed_seat_id: seatIdToAssign, caution_refunded: false, caution_paid: false, registration_paid: false, join_date: getISTTimestamp(),
  }).eq("id", reader.id));

  if (!openBill) {
    const settings = await getHubSettings();
    const planType = normalizePlanType(reader.reader_type ?? "monthly");
    const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
    const invoice = planType === "monthly" ? calculateMonthlyAdmissionAmount(getISTDate(), planFee) : calculateInvoiceAmount({ planType, monthlyFee: planFee, includeAdmissionFees: false, joinDate: getISTDate() });
    
    const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, getISTDate()) : false;
    const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
    const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
    const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

    sideEffects.push(supabase.from("bills").insert({
      reader_id: reader.id, month: null, year: null, due_date: getISTDateString(), invoice_kind: "manual",
      title: "Rejoin admission invoice", base_amount: invoice.baseAmount, registration_amount: registrationAmount, caution_amount: cautionAmount,
      prorated_days: (invoice as any).remainingDays ?? null, amount_due: totalAmount, amount_paid: 0, status: "pending",
    }));

    sideEffects.push(notifyReader(reader.id, {
      category: "billing", title: "Payment due after rejoin", body: `Your rejoin ${formatPlanLabel(planType).toLowerCase()} invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`, link: "/student/payments",
    }));
  }

  sideEffects.push(notifyReader(reader.id, { category: "account", title: "Rejoin approved", body: "Your access has been restored. Complete payment to reactivate your dashboard.", link: "/student/payments" }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
}

export async function createRejoinInvoiceAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  if (!readerId) return;

  const { data: reader } = await supabase.from("readers").select("id, status, reader_type, monthly_fee, join_date").eq("id", readerId).maybeSingle();
  if (!reader || reader.status !== "pending_payment") return;

  const { data: openBill } = await supabase.from("bills").select("id").eq("reader_id", reader.id).in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]).maybeSingle();
  if (openBill) return;

  const settings = await getHubSettings();
  const planType = normalizePlanType(reader.reader_type ?? "monthly");
  const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
  const now = getISTDate();
  const invoice = planType === "monthly" ? calculateMonthlyAdmissionAmount(now, planFee) : calculateInvoiceAmount({ planType, monthlyFee: planFee, includeAdmissionFees: false, joinDate: now });
  
  const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, getISTDate()) : false;
  const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
  const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
  const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

  await supabase.from("bills").insert({
    reader_id: reader.id, month: null, year: null, due_date: getISTDateString(), invoice_kind: "manual",
    title: "Rejoin admission invoice", base_amount: invoice.baseAmount, registration_amount: registrationAmount, caution_amount: cautionAmount,
    prorated_days: (invoice as any).remainingDays ?? null, amount_due: totalAmount, amount_paid: 0, status: "pending",
  });

  await notifyReader(reader.id, { category: "billing", title: "Payment due", body: `Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`, link: "/student/payments" });

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}

const MANAGEABLE_STUDENT_STATUSES = new Set(["pending_payment", "pending_onboarding", "active", "inactive", "waitlist", "rejected", "archived"]);

export async function bulkUpdateStudentStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerIds = getStringArray(formData, "reader_ids");
  const status = getString(formData, "status");
  if (!status || readerIds.length === 0 || !MANAGEABLE_STUDENT_STATUSES.has(status)) return;

  await supabase.from("readers").update({ status }).in("id", readerIds);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function bulkCreateRejoinInvoicesAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerIds = getStringArray(formData, "reader_ids");
  if (readerIds.length === 0) return;

  const { data: readers } = await supabase.from("readers").select("id, status, reader_type, monthly_fee, join_date").in("id", readerIds).eq("status", "pending_payment");
  const settings = await getHubSettings();

  for (const reader of readers ?? []) {
    const { data: openBill } = await supabase.from("bills").select("id").eq("reader_id", reader.id).in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]).maybeSingle();
    if (openBill) continue;

    const planType = normalizePlanType(reader.reader_type ?? "monthly");
    const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
    const invoice = planType === "monthly" ? calculateMonthlyAdmissionAmount(getISTDate(), planFee) : calculateInvoiceAmount({ planType, monthlyFee: planFee, includeAdmissionFees: false, joinDate: getISTDate() });
    
    const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, getISTDate()) : false;
    const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
    const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
    const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

    await supabase.from("bills").insert({
      reader_id: reader.id, month: null, year: null, due_date: getISTDateString(), invoice_kind: "manual",
      title: "Rejoin admission invoice", base_amount: invoice.baseAmount, registration_amount: registrationAmount, caution_amount: cautionAmount,
      prorated_days: (invoice as any).remainingDays ?? null, amount_due: totalAmount, amount_paid: 0, status: "pending",
    });

    await notifyReader(reader.id, { category: "billing", title: "Payment due", body: `Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`, link: "/student/payments" });
  }

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}

export async function bulkSendStudentAdminNoteAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const readerIds = getStringArray(formData, "reader_ids");
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const link = getOptionalString(formData, "link");
  if (readerIds.length === 0 || !title || !body) return;

  await Promise.allSettled(readerIds.map((readerId) => notifyReader(readerId, { category: "account", title, body, link: link || "/student" })));

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function bulkStudentBatchAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const operation = getString(formData, "operation");

  if (operation === "status") return bulkUpdateStudentStatusAction(formData);
  if (operation === "invoice") return bulkCreateRejoinInvoicesAction(formData);
  if (operation === "note") return bulkSendStudentAdminNoteAction(formData);
}

export async function sendStudentAdminNoteAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const readerId = getString(formData, "reader_id");
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const link = getOptionalString(formData, "link");
  if (!readerId || !title || !body) return;

  await notifyReader(readerId, { category: "account", title, body, link: link || "/student" });

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function updateStudentStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const status = getString(formData, "status");
  if (!readerId || !MANAGEABLE_STUDENT_STATUSES.has(status)) return;

  await supabase.from("readers").update({ status }).eq("id", readerId);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function updateStudentMonthlyFeeAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const monthlyFee = getNumber(formData, "monthly_fee", 0);
  if (!readerId || monthlyFee <= 0) return;

  await supabase.from("readers").update({ monthly_fee: monthlyFee }).eq("id", readerId);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function convertStudentToMonthlyAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const requestedMonthlyFee = getNumber(formData, "monthly_fee", 0);
  if (!readerId) return;

  const settings = await getHubSettings();
  const monthlyFee = Math.max(0, requestedMonthlyFee || settings.default_monthly_price || 1650);

  const { data: reader } = await supabase.from("readers").select("id,user_id,name,email,reader_type,status,monthly_fee,registration_paid,caution_paid,join_date").eq("id", readerId).maybeSingle();
  if (!reader) return;

  if (!reader.email) {
    await notifyActor(profile.id, "Conversion blocked", "Student email is mandatory to convert to monthly.");
    return;
  }
  if (normalizePlanType(reader.reader_type ?? "monthly") === "monthly") {
    await notifyActor(profile.id, "No change", "Student is already on monthly plan.");
    return;
  }

  const { data: openBill } = await supabase.from("bills").select("id").eq("reader_id", reader.id).in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]).maybeSingle();
  if (openBill) {
    await notifyActor(profile.id, "Conversion blocked", "Close existing open invoice(s) before converting to monthly.");
    return;
  }

  let userId = reader.user_id;
  if (!userId) {
    const password = `Bodhi${randomBytes(4).toString("hex")}!`;
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({ email: reader.email, password, email_confirm: true, user_metadata: { full_name: reader.name } });

    if (createUserError) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find((user) => user.email === reader.email);
      if (!existingUser) {
        await notifyActor(profile.id, "Conversion failed", `Could not create monthly portal login for ${reader.email}.`);
        return;
      }
      await supabase.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true, user_metadata: { full_name: reader.name } });
      userId = existingUser.id;
    } else {
      userId = createdUser.user?.id ?? null;
    }

    if (!userId) {
      await notifyActor(profile.id, "Conversion failed", "Could not resolve auth user for this student.");
      return;
    }

    await supabase.from("profiles").upsert({ id: userId, full_name: reader.name, role: "student", onboarding_required: true });

    const credentialEmail = emailTemplates.credentials({ name: reader.name, email: reader.email, password });
    await sendEmail({ to: [reader.email], subject: credentialEmail.subject, html: credentialEmail.html, text: credentialEmail.text });
  }

  const now = getISTDate();
  const invoice = calculateMonthlyAdmissionAmount(now, monthlyFee);
  const registrationApplicable = !reader.registration_paid && isRegistrationFeeApplicable(reader.join_date, now);
  const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
  const cautionAmount = reader.caution_paid ? 0 : invoice.cautionAmount;
  const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

  const { error: createBillError } = await supabase.from("bills").insert({
    reader_id: reader.id, month: null, year: null, due_date: getIsoDateOnly(getISTDate()), invoice_kind: "manual", title: "Monthly conversion invoice",
    base_amount: invoice.baseAmount, registration_amount: registrationAmount, caution_amount: cautionAmount, prorated_days: invoice.remainingDays ?? null, amount_due: totalAmount, amount_paid: 0, status: "pending",
  });
  
  if (createBillError) {
    await notifyActor(profile.id, "Conversion failed", createBillError.message || "Could not create monthly conversion invoice.");
    return;
  }

  await supabase.from("readers").update({
    user_id: userId, reader_type: "monthly", monthly_fee: monthlyFee, status: "pending_payment", onboarding_completed: true, credentials_sent_at: getISTTimestamp(),
  }).eq("id", reader.id);

  await notifyReader(reader.id, { category: "billing", title: "Monthly conversion invoice created", body: `You have been upgraded to monthly plan. Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`, link: "/student/payments" });

  revalidatePath("/super-admin/students");
  revalidatePath(`/super-admin/students/${reader.id}`);
  revalidatePath("/staff/students");
  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}
