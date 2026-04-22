"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireDashboardContext } from "@/lib/auth";
import {
  calculateInvoiceAmount,
  calculateMonthlyAdmissionAmount,
  getCurrentBillingPeriod,
  isRegistrationFeeApplicable,
  normalizeRole,
  type AppRole,
  type ExamCategory,
  type PlanType,
} from "@/lib/billing-utils";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmail, sendEmailBatched } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createNotification, notifyProfileIds, notifyReader } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function getIsoDateTime(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function revalidateCalendarPaths() {
  revalidatePath("/student");
  revalidatePath("/student/calendar");
  revalidatePath("/staff/content");
  revalidatePath("/staff/content/calendar");
  revalidatePath("/super-admin/content");
  revalidatePath("/super-admin/content/calendar");
}

function revalidateStudentCalendarPaths() {
  revalidatePath("/student");
  revalidatePath("/student/calendar");
}

function revalidateSupportPaths() {
  revalidatePath("/student");
  revalidatePath("/staff");
  revalidatePath("/staff/support");
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/support");
}

function normalizePlanType(value: string): PlanType {
  if (value === "daily" || value === "weekly" || value === "monthly") return value;
  return "monthly";
}

function planDefaultPrice(
  planType: PlanType,
  settings: { daily_price: number; weekly_price: number; default_monthly_price: number },
) {
  if (planType === "daily") return Number(settings.daily_price) || 150;
  if (planType === "weekly") return Number(settings.weekly_price) || 650;
  return Number(settings.default_monthly_price) || 1650;
}

function getIsoDateOnly(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getMondayOfCurrentWeek(date = new Date()) {
  const monday = new Date(date);
  const day = monday.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatPlanLabel(planType: PlanType) {
  if (planType === "daily") return "Daily";
  if (planType === "weekly") return "Weekly";
  return "Monthly";
}

type SimpleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type PaymentProofActionState = SimpleActionState & {
  billId: string | null;
};

type CalendarFieldErrors = Partial<Record<"title" | "starts_at" | "ends_at", string>>;

type CalendarActionState = SimpleActionState & {
  fieldErrors: CalendarFieldErrors;
};

function successState(message: string): SimpleActionState {
  return { status: "success", message };
}

function errorState(message: string): SimpleActionState {
  return { status: "error", message };
}

const CALENDAR_EVENT_TYPES = new Set([
  "exam_deadline",
  "exam_date",
  "admit_card",
  "result",
  "hub_event",
  "holiday",
  "other",
]);

const CALENDAR_EVENT_STATUSES = new Set(["draft", "published", "archived"]);
const CALENDAR_EVENT_AUDIENCES = new Set(["student", "public"]);
const STUDENT_CALENDAR_ENTRY_TYPES = new Set(["goal", "personal_event", "reminder"]);
const STUDENT_CALENDAR_ENTRY_STATUSES = new Set(["planned", "completed", "cancelled"]);
const SUPPORT_TICKET_STATUSES = new Set(["open", "in_review", "resolved", "closed"]);

async function requireRole(allowedRoles: AppRole[]) {
  return requireDashboardContext(allowedRoles);
}

async function getStaffAndAdminProfileIds() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role")
    .in("role", ["super_admin", "staff"]);

  return (data ?? [])
    .filter((profile) => {
      const role = normalizeRole(profile.role);
      return role === "super_admin" || role === "staff";
    })
    .map((profile) => profile.id);
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

export async function convertEnquiryToStudent(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const enquiryId = getString(formData, "enquiry_id");
  const seatId = getString(formData, "seat_id");
  const email = getString(formData, "email");
  const planType = normalizePlanType(getString(formData, "reader_type"));
  const portalAccess = getString(formData, "portal_access") === "yes";
  const planFeeInput = getNumber(formData, "plan_fee", 0) || getNumber(formData, "monthly_fee", 0);
  const joinDateValue = getOptionalString(formData, "join_date");
  const joinDate = joinDateValue ? new Date(joinDateValue) : new Date();

  if (!enquiryId || !seatId || !email) {
    await notifyActor(profile.id, "Conversion failed", "Enquiry, seat, and email are required to convert a student.");
    return;
  }

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("*")
    .eq("id", enquiryId)
    .maybeSingle();

  if (!enquiry) {
    await notifyActor(profile.id, "Conversion failed", "Enquiry record was not found.");
    return;
  }

  const allowedEnquiryStatuses = new Set(["new", "contacted", "seat_blocked"]);
  if (!allowedEnquiryStatuses.has(enquiry.status)) {
    await notifyActor(
      profile.id,
      "Conversion blocked",
      `Enquiry status '${enquiry.status}' cannot be converted.`,
    );
    return;
  }

  const { data: seat } = await supabase
    .from("seats")
    .select("id, status, seat_number, linked_enquiry_id")
    .eq("id", seatId)
    .maybeSingle();

  const canUseSeat =
    !!seat &&
    (seat.status === "available" ||
      (seat.status === "blocked" && seat.linked_enquiry_id === enquiryId));

  if (!canUseSeat) {
    await notifyActor(
      profile.id,
      "Conversion blocked",
      "Selected seat is no longer available. Pick another available seat and retry.",
    );
    return;
  }

  const createPortalLogin = portalAccess || planType === "monthly";
  const password = `Bodhi${randomBytes(4).toString("hex")}!`;
  let userId: string | null = null;

  if (createPortalLogin) {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: enquiry.name },
    });

    if (createUserError) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find((user) => user.email === email);
      if (!existingUser) {
        await notifyActor(profile.id, "Conversion failed", `Could not create student login for ${email}.`);
        return;
      }
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: enquiry.name },
      });
      userId = existingUser.id;
    } else {
      userId = createdUser.user?.id ?? null;
    }

    if (!userId) {
      await notifyActor(profile.id, "Conversion failed", "Could not resolve student auth user.");
      return;
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: enquiry.name,
      role: "student",
      onboarding_required: true,
    });
  }
  const settings = await getHubSettings();
  const effectivePlanFee = Math.max(0, planFeeInput || planDefaultPrice(planType, settings));

  const { data: student, error: studentError } = await supabase
    .from("readers")
    .insert({
      user_id: createPortalLogin ? userId : null,
      name: enquiry.name,
      email,
      phone: enquiry.phone,
      reader_type: planType,
      status: createPortalLogin ? "pending_onboarding" : "pending_payment",
      fixed_seat_id: seatId,
      monthly_fee: effectivePlanFee,
      onboarding_completed: !createPortalLogin,
      converted_from_enquiry_id: enquiryId,
      credentials_sent_at: new Date().toISOString(),
      join_date: joinDate.toISOString(),
    })
    .select("id")
    .single();

  if (studentError || !student) {
    await notifyActor(
      profile.id,
      "Conversion failed",
      studentError?.message || "Reader profile creation failed.",
    );
    return;
  }

  await supabase
    .from("seats")
    .update({
      status: "occupied",
      assigned_reader_id: student.id,
      linked_enquiry_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
    })
    .eq("id", seatId);

  await supabase
    .from("seats")
    .update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    })
    .eq("linked_enquiry_id", enquiryId)
    .eq("status", "blocked")
    .neq("id", seatId);

  await supabase
    .from("enquiries")
    .update({
      status: "converted",
      converted_reader_id: student.id,
      converted_at: new Date().toISOString(),
      assigned_to: profile.id,
    })
    .eq("id", enquiryId);

  const invoice =
    planType === "monthly"
      ? calculateMonthlyAdmissionAmount(joinDate, effectivePlanFee)
      : calculateInvoiceAmount({
          planType,
          monthlyFee: effectivePlanFee,
          includeAdmissionFees: false,
          joinDate,
        });
  const invoiceTitle = planType === "monthly" ? "Admission invoice" : `${formatPlanLabel(planType)} plan invoice`;
  const invoiceKind = planType === "monthly" ? "admission" : "manual";
  const dueDate = getIsoDateOnly(joinDate);
  const { data: admissionBill } = await supabase
    .from("bills")
    .insert({
      reader_id: student.id,
      month: joinDate.getMonth() + 1,
      year: joinDate.getFullYear(),
      due_date: dueDate,
      invoice_kind: invoiceKind,
      title: invoiceTitle,
      base_amount: invoice.baseAmount,
      registration_amount: invoice.registrationAmount,
      caution_amount: invoice.cautionAmount,
      prorated_days: (invoice as { remainingDays?: number }).remainingDays ?? null,
      amount_due: invoice.totalAmount,
      amount_paid: 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (admissionBill?.id && email) {
    const admissionEmail = emailTemplates.admissionInvoice({
      name: enquiry.name,
      invoiceId: admissionBill.id,
      registration: invoice.registrationAmount,
      caution: invoice.cautionAmount,
      monthly: invoice.baseAmount,
      proratedDays: (invoice as { remainingDays?: number }).remainingDays ?? null,
      total: invoice.totalAmount,
      dueDate,
      qrUrl: settings.static_upi_qr_url,
      upiId: settings.static_upi_id,
    });
    await sendEmail({
      to: [email],
      subject: admissionEmail.subject,
      html: admissionEmail.html,
      text: admissionEmail.text,
    });
  }

  if (createPortalLogin) {
    const credentialEmail = emailTemplates.credentials({
      name: enquiry.name,
      email,
      password,
    });

    await sendEmail({
      to: [email],
      subject: credentialEmail.subject,
      html: credentialEmail.html,
      text: credentialEmail.text,
    });

    await notifyReader(student.id, {
      category: "account",
      title: "Your account is ready",
      body: "Login with the credentials sent to your email and complete onboarding.",
      link: "/student/onboarding",
    });
  }

  if (settings.billing_notification_emails.length > 0) {
    await sendEmail({
      to: settings.billing_notification_emails,
      subject: `Student converted: ${enquiry.name}`,
      html: `<p>${enquiry.name} was converted to a ${planType} student and assigned a seat. Portal access: ${createPortalLogin ? "yes" : "no"}.</p>`,
    });
  }

  revalidatePath("/super-admin/enquiries");
  revalidatePath(`/super-admin/enquiries/${enquiryId}`);
  revalidatePath("/super-admin/students");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/enquiries");
  revalidatePath("/staff/students");
  revalidatePath("/staff/seats");

  return;
}

export async function onboardStudentAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const name = getString(formData, "name");
  const email = getOptionalString(formData, "email");
  const phone = getString(formData, "phone");
  const readerType = normalizePlanType(getString(formData, "reader_type"));
  const seatId = getString(formData, "seat_id");
  const monthlyFee = getNumber(formData, "monthly_fee", 0);
  const joinDateValue = getOptionalString(formData, "join_date");
  const joinDate = joinDateValue ? new Date(joinDateValue) : new Date();

  const address = getOptionalString(formData, "address");
  const purpose = getOptionalString(formData, "purpose");
  const preparingForExam = getString(formData, "preparing_for_exam") === "yes";
  const examDetails = getOptionalString(formData, "exam_details");
  const idProofFile = getFile(formData, "id_proof");

  const isQuickEntry = readerType === "daily" || readerType === "weekly";

  if (!name || !phone || !seatId) {
    await notifyActor(profile.id, "Onboarding failed", "Name, phone, and seat are required.");
    return;
  }

  // Handle ID Proof Upload (Skip for quick entry)
  let idProofUrl = null;
  let idProofPublicId = null;

  if (!isQuickEntry && idProofFile) {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (idProofFile.size <= MAX_FILE_SIZE && idProofFile.type.startsWith("image/")) {
      try {
        const uploaded = await uploadToCloudinary(idProofFile, "bodhi-id-proofs");
        idProofUrl = uploaded.secureUrl;
        idProofPublicId = uploaded.publicId;
      } catch (err) {
        console.error("[onboardStudentAction] ID upload failed:", err);
      }
    }
  }

  // Check if seat is available
  const { data: seat } = await supabase
    .from("seats")
    .select("id, status, seat_number")
    .eq("id", seatId)
    .maybeSingle();

  if (!seat) {
    await notifyActor(profile.id, "Onboarding failed", "Selected seat does not exist.");
    return;
  }

  // Monthly students MUST have an available seat
  if (readerType === "monthly" && seat.status !== "available") {
    await notifyActor(profile.id, "Onboarding failed", "Monthly students require an available seat.");
    return;
  }

  const password = `Bodhi${randomBytes(4).toString("hex")}!`;
  let userId: string | null = null;

  // Account creation (Skip for quick entry)
  if (!isQuickEntry && email) {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createUserError) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find((u) => u.email === email);
      if (existingUser) {
        userId = existingUser.id;
        await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { full_name: name },
        });
      } else {
        await notifyActor(profile.id, "Onboarding failed", `Auth error: ${createUserError.message}`);
        return;
      }
    } else {
      userId = createdUser.user?.id ?? null;
    }

    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: name,
        role: "student",
        onboarding_required: false,
      });
    }
  }

  const settings = await getHubSettings();
  const effectivePlanFee = Math.max(0, monthlyFee || planDefaultPrice(readerType, settings));

  const { data: student, error: studentError } = await supabase
    .from("readers")
    .insert({
      user_id: userId,
      name,
      email,
      phone,
      reader_type: readerType,
      status: "pending_payment",
      fixed_seat_id: seatId,
      monthly_fee: effectivePlanFee,
      onboarding_completed: isQuickEntry || !!idProofUrl, // true for quick entry or if ID uploaded
      join_date: joinDate.toISOString(),
      address,
      purpose,
      preparing_for_exam: preparingForExam,
      exam_details: examDetails,
      id_proof_url: idProofUrl,
      id_proof_public_id: idProofPublicId,
      credentials_sent_at: email ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    await notifyActor(profile.id, "Onboarding failed", studentError?.message || "Reader profile creation failed.");
    return;
  }

  if (seat.status === "available") {
    await supabase
      .from("seats")
      .update({
        status: "occupied",
        assigned_reader_id: student.id,
        linked_enquiry_id: null,
        blocked_by_profile_id: null,
        block_reason: null,
      })
      .eq("id", seatId);
  }

  const invoice =
    readerType === "monthly"
      ? calculateMonthlyAdmissionAmount(joinDate, effectivePlanFee)
      : calculateInvoiceAmount({
          planType: readerType,
          monthlyFee: effectivePlanFee,
          includeAdmissionFees: false,
          joinDate,
        });

  const invoiceTitle = readerType === "monthly" ? "Admission invoice" : `${formatPlanLabel(readerType)} plan invoice`;
  const invoiceKind = readerType === "monthly" ? "admission" : "manual";
  const dueDate = getIsoDateOnly(joinDate);

  const { data: admissionBill } = await supabase
    .from("bills")
    .insert({
      reader_id: student.id,
      month: joinDate.getMonth() + 1,
      year: joinDate.getFullYear(),
      due_date: dueDate,
      invoice_kind: invoiceKind,
      title: invoiceTitle,
      base_amount: invoice.baseAmount,
      registration_amount: invoice.registrationAmount,
      caution_amount: invoice.cautionAmount,
      prorated_days: (invoice as any).remainingDays ?? null,
      amount_due: invoice.totalAmount,
      amount_paid: 0,
      status: "pending",
    })
    .select("id")
    .single();

  if (email) {
    const credentialEmail = emailTemplates.credentials({
      name,
      email,
      password,
    });
    await sendEmail({
      to: [email],
      subject: credentialEmail.subject,
      html: credentialEmail.html,
      text: credentialEmail.text,
    });

    if (admissionBill?.id) {
      const admissionEmail = emailTemplates.admissionInvoice({
        name,
        invoiceId: admissionBill.id,
        registration: invoice.registrationAmount,
        caution: invoice.cautionAmount,
        monthly: invoice.baseAmount,
        proratedDays: (invoice as any).remainingDays ?? null,
        total: invoice.totalAmount,
        dueDate,
        qrUrl: settings.static_upi_qr_url,
        upiId: settings.static_upi_id,
      });
      await sendEmail({
        to: [email],
        subject: admissionEmail.subject,
        html: admissionEmail.html,
        text: admissionEmail.text,
      });
    }
  }

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
  
  const role = normalizeRole(profile.role);
  if (role === "super_admin") {
    redirect("/super-admin/students");
  } else {
    redirect("/staff/students");
  }
}

export async function blockSeatForEnquiry(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const seatId = getString(formData, "seat_id");
  const enquiryId = getOptionalString(formData, "enquiry_id");
  const reason = getString(formData, "reason") || "Seat blocked for follow-up";

  if (!seatId) {
    await notifyActor(profile.id, "Seat block failed", "Seat is required.");
    return;
  }

  const { data: seat } = await supabase
    .from("seats")
    .select("id, status, seat_number")
    .eq("id", seatId)
    .maybeSingle();

  if (!seat) {
    await notifyActor(profile.id, "Seat block failed", "Seat record not found.");
    return;
  }

  if (seat.status !== "available") {
    await notifyActor(
      profile.id,
      "Seat block failed",
      `Seat ${seat.seat_number ?? ""} is currently '${seat.status}', not available.`,
    );
    return;
  }

  if (enquiryId) {
    const { data: enquiryState } = await supabase
      .from("enquiries")
      .select("status")
      .eq("id", enquiryId)
      .maybeSingle();

    if (enquiryState?.status === "converted") {
      await notifyActor(profile.id, "Seat block skipped", "This enquiry is already converted.");
      return;
    }
  }

  await supabase
    .from("seats")
    .update({
      status: "blocked",
      blocked_by_profile_id: profile.id,
      block_reason: reason,
      linked_enquiry_id: enquiryId,
    })
    .eq("id", seatId);

  if (enquiryId) {
    await supabase.from("enquiries").update({ status: "seat_blocked" }).eq("id", enquiryId);

    const { data: enquiry } = await supabase.from("enquiries").select("name, email").eq("id", enquiryId).maybeSingle();
    const { data: seatDetails } = await supabase.from("seats").select("seat_number").eq("id", seatId).maybeSingle();

    if (enquiry && enquiry.email) {
      const emailTemplate = emailTemplates.seatAvailable({
        name: enquiry.name,
        seatLabel: seatDetails?.seat_number || seatId,
      });
      await sendEmail({
        to: [enquiry.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }
  }

  revalidatePath("/super-admin/seats");
  revalidatePath("/super-admin/enquiries");
  if (enquiryId) revalidatePath(`/super-admin/enquiries/${enquiryId}`);
  revalidatePath("/staff/seats");
  revalidatePath("/staff/enquiries");
  return;
}

export async function updateEnquiryAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const enquiryId = getString(formData, "enquiry_id");
  const status = getString(formData, "status");
  const notes = getOptionalString(formData, "notes");
  const assignedTo = getOptionalString(formData, "assigned_to");

  if (!enquiryId) return;
  const allowedStatuses = new Set(["new", "contacted", "seat_blocked", "converted", "closed"]);
  if (!allowedStatuses.has(status)) return;

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("id, status")
    .eq("id", enquiryId)
    .maybeSingle();
  if (!enquiry) return;

  // Converted enquiries should not be reopened accidentally.
  if (enquiry.status === "converted" && !["converted", "closed"].includes(status)) {
    await notifyActor(profile.id, "Enquiry update blocked", "Converted enquiries can only stay converted or be closed.");
    return;
  }

  await supabase
    .from("enquiries")
    .update({
      status,
      notes,
      assigned_to: assignedTo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId);

  revalidatePath("/super-admin/enquiries");
  revalidatePath(`/super-admin/enquiries/${enquiryId}`);
  revalidatePath("/staff/enquiries");
}

export async function releaseSeat(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const seatId = getString(formData, "seat_id");

  if (!seatId) {
    return;
  }

  await supabase
    .from("seats")
    .update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    })
    .eq("id", seatId);

  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
  return;
}

export async function submitOnboarding(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const { student } = await requireRole(["student"]);
  if (!student) {
    return { error: "Session expired. Please sign in again." };
  }

  const supabase = createAdminClient();
  const address = getString(formData, "address");
  const purpose = getString(formData, "purpose");
  const preparingForExam = getString(formData, "preparing_for_exam") === "yes";
  const examDetails = getOptionalString(formData, "exam_details");
  const categories = formData
    .getAll("exam_categories")
    .map((entry) => (typeof entry === "string" ? entry : ""))
    .filter(Boolean) as ExamCategory[];
  const idProof = getFile(formData, "id_proof");

  if (!address || !purpose || !idProof) {
    return { error: "Please fill all required fields and upload an ID proof." };
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (idProof.size > MAX_FILE_SIZE) {
    return { error: "ID proof file is too large. Please upload an image under 5MB." };
  }
  if (!idProof.type.startsWith("image/")) {
    return { error: "Invalid file type. Please upload an image for ID proof." };
  }

  try {
    const uploadedId = await uploadToCloudinary(idProof, "bodhi-id-proofs");
    const { count: pendingBills } = await supabase
      .from("bills")
      .select("*", { count: "exact", head: true })
      .eq("reader_id", student.id)
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]);

    const { error: updateError } = await supabase
      .from("readers")
      .update({
        address,
        purpose,
        preparing_for_exam: preparingForExam,
        exam_details: examDetails,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        id_proof_url: uploadedId.secureUrl,
        id_proof_public_id: uploadedId.publicId,
        status: (pendingBills ?? 0) > 0 ? "pending_payment" : "active",
      })
      .eq("id", student.id);

    if (updateError) {
      console.error("[submitOnboarding] Supabase update error:", JSON.stringify(updateError));
      return { error: `Database error: ${updateError.message} (code: ${updateError.code})` };
    }

    await supabase.from("student_exam_interests").delete().eq("reader_id", student.id);
    if (categories.length > 0) {
      await supabase.from("student_exam_interests").insert(
        categories.map((category) => ({
          reader_id: student.id,
          category,
        })),
      );
    }

    revalidatePath("/student");
    revalidatePath("/student/onboarding");
    // Return null — redirect happens OUTSIDE try/catch (Next.js redirect throws internally)
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[submitOnboarding] failed:", message);
    return { error: `Upload failed: ${message}. Please try a smaller image or check your connection.` };
  }
}


// Redirect is called by the page after receiving error: null

export async function updateExamInterestsAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const preparingForExam = getString(formData, "preparing_for_exam") === "yes";
  const categories = formData
    .getAll("exam_categories")
    .map((e) => (typeof e === "string" ? e : ""))
    .filter(Boolean) as ExamCategory[];

  await supabase
    .from("readers")
    .update({ preparing_for_exam: preparingForExam })
    .eq("id", student.id);

  await supabase.from("student_exam_interests").delete().eq("reader_id", student.id);
  if (categories.length > 0) {
    await supabase.from("student_exam_interests").insert(
      categories.map((category) => ({ reader_id: student.id, category })),
    );
  }

  revalidatePath("/student");
  revalidatePath("/student/profile");
  revalidatePath("/student/exams");
  revalidatePath("/student/resources");
}

export async function requestSeatChangeAction(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return errorState("Your session expired. Please sign in again.");

  const supabase = createAdminClient();
  const newSeatId = getString(formData, "new_seat_id");
  if (!newSeatId) return errorState("Select a preferred seat before submitting.");
  if (student.fixed_seat_id === newSeatId) {
    return errorState("You are already assigned to that seat.");
  }

  const { data: existingPending } = await supabase
    .from("seat_change_requests")
    .select("id")
    .eq("reader_id", student.id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (existingPending) {
    return errorState("You already have a pending seat-change request.");
  }

  const { data: newSeat } = await supabase
    .from("seats")
    .select("id, seat_number, status")
    .eq("id", newSeatId)
    .eq("status", "available")
    .maybeSingle();

  if (!newSeat) return errorState("That seat is no longer available. Pick another seat and try again.");

  const { data: oldSeat } = student.fixed_seat_id
    ? await supabase.from("seats").select("seat_number").eq("id", student.fixed_seat_id).maybeSingle()
    : { data: null };

  const { data: request, error: requestError } = await supabase
    .from("seat_change_requests")
    .insert({
      reader_id: student.id,
      current_seat_id: student.fixed_seat_id ?? null,
      requested_seat_id: newSeat.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (requestError || !request) {
    return errorState(requestError?.message || "Could not submit your seat-change request.");
  }

  await createNotification({
    audienceType: "broadcast_role",
    category: "seat_change_request",
    title: "Seat Change Request",
    body: `${student.name} wants to move from Seat #${oldSeat?.seat_number ?? "?"} → Seat #${newSeat.seat_number}.`,
    link: "/staff/seats",
    metadata: {
      request_id: request.id,
      reader_id: student.id,
      reader_name: student.name,
      old_seat_id: student.fixed_seat_id ?? null,
      old_seat_number: oldSeat?.seat_number ?? null,
      new_seat_id: newSeat.id,
      new_seat_number: newSeat.seat_number,
    },
  });

  revalidatePath("/student");
  revalidatePath("/student/profile");
  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");

  return successState(`Seat #${newSeat.seat_number} has been requested. Staff approval is still pending.`);
}

export async function approveSeatChangeAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const requestId = getString(formData, "request_id");
  if (!requestId) return;

  const { data: request } = await supabase
    .from("seat_change_requests")
    .select("id, reader_id, current_seat_id, requested_seat_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") return;

  const { data: requestedSeat } = await supabase
    .from("seats")
    .select("seat_number, status")
    .eq("id", request.requested_seat_id)
    .maybeSingle();

  if (!requestedSeat || requestedSeat.status !== "available") return;

  if (request.current_seat_id) {
    await supabase
      .from("seats")
      .update({ status: "available", assigned_reader_id: null })
      .eq("id", request.current_seat_id);
  }

  await supabase
    .from("seats")
    .update({ status: "occupied", assigned_reader_id: request.reader_id })
    .eq("id", request.requested_seat_id);

  await supabase
    .from("readers")
    .update({ fixed_seat_id: request.requested_seat_id })
    .eq("id", request.reader_id);

  await supabase
    .from("seat_change_requests")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by_profile_id: profile.id,
    })
    .eq("id", requestId);

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("category", "seat_change_request")
    .contains("metadata", { request_id: requestId });

  await notifyReader(request.reader_id, {
    category: "account",
    title: "Seat Change Approved",
    body: `Your request to move to Seat #${requestedSeat.seat_number} has been approved.`,
    link: "/student/profile",
  });

  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");
  revalidatePath("/student");
  revalidatePath("/student/profile");
}

export async function denySeatChangeAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const requestId = getString(formData, "request_id");
  if (!requestId) return;

  const { data: request } = await supabase
    .from("seat_change_requests")
    .select("id, reader_id, requested_seat_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") return;

  const { data: requestedSeat } = await supabase
    .from("seats")
    .select("seat_number")
    .eq("id", request.requested_seat_id)
    .maybeSingle();

  await supabase
    .from("seat_change_requests")
    .update({
      status: "declined",
      resolved_at: new Date().toISOString(),
      resolved_by_profile_id: profile.id,
    })
    .eq("id", requestId);

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("category", "seat_change_request")
    .contains("metadata", { request_id: requestId });

  await notifyReader(request.reader_id, {
    category: "account",
    title: "Seat Change Declined",
    body: `Your request for Seat #${requestedSeat?.seat_number ?? "?"} was declined by staff. Please contact the hub for more info.`,
    link: "/student/profile",
  });

  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");
  revalidatePath("/student/profile");
}

export async function submitPaymentProof(
  _prevState: PaymentProofActionState,
  formData: FormData,
): Promise<PaymentProofActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) {
    return { status: "error", message: "Your session expired. Please sign in again.", billId: null };
  }

  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const amount = getNumber(formData, "amount", 0);
  const referenceNumber = getOptionalString(formData, "reference_number");
  const proofFile = getFile(formData, "payment_proof");

  if (!billId || amount <= 0 || !proofFile) {
    return { status: "error", message: "Add the payment amount and attach a screenshot before submitting.", billId };
  }

  const { data: bill } = await supabase
    .from("bills")
    .select("id, reader_id, status")
    .eq("id", billId)
    .eq("reader_id", student.id)
    .maybeSingle();

  if (!bill) {
    return { status: "error", message: "That invoice could not be found.", billId };
  }

  if (bill.status === "paid") {
    return { status: "error", message: "This invoice is already marked as paid.", billId };
  }

  const { data: existingPending } = await supabase
    .from("transactions")
    .select("id")
    .eq("bill_id", billId)
    .eq("reader_id", student.id)
    .eq("verification_status", "pending")
    .limit(1)
    .maybeSingle();

  if (existingPending || bill.status === "proof_submitted") {
    return {
      status: "error",
      message: "A payment proof is already awaiting verification for this invoice.",
      billId,
    };
  }

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (proofFile.size > MAX_FILE_SIZE) {
    return { status: "error", message: "Payment proof file is too large. Please upload an image under 5MB.", billId };
  }
  if (!proofFile.type.startsWith("image/")) {
    return { status: "error", message: "Invalid file type. Please upload an image for payment proof.", billId };
  }

  let uploadedProof: { secureUrl: string; publicId: string } | null = null;

  try {
    uploadedProof = await uploadToCloudinary(proofFile, "bodhi-payment-proofs");

    const { error: transactionError } = await supabase.from("transactions").insert({
      reader_id: student.id,
      bill_id: billId,
      type: "upi",
      amount,
      payment_mode: "upi",
      reference_number: referenceNumber,
      payment_proof_url: uploadedProof.secureUrl,
      payment_proof_public_id: uploadedProof.publicId,
      verification_status: "pending",
      submitted_at: new Date().toISOString(),
    });

    if (transactionError) {
      throw new Error(transactionError.message);
    }

    const { error: billError } = await supabase
      .from("bills")
      .update({ status: "proof_submitted" })
      .eq("id", billId)
      .eq("reader_id", student.id);

    if (billError) {
      throw new Error(billError.message);
    }

    const profileIds = await getStaffAndAdminProfileIds();
    await notifyProfileIds(profileIds, {
      category: "payment",
      title: "New payment proof submitted",
      body: `${student.name} uploaded a payment screenshot for verification.`,
      link: "/staff/billing",
    });

    const settings = await getHubSettings();
    if (settings.billing_notification_emails.length > 0) {
      const template = emailTemplates.paymentProofSubmitted({
        studentName: student.name,
        amount,
        invoiceId: billId,
        dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/staff/billing`,
      });
      await sendEmail({
        to: settings.billing_notification_emails,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    }

    revalidatePath("/student");
    revalidatePath("/student/payments");
    revalidatePath("/super-admin/billing");
    revalidatePath(`/super-admin/billing/${billId}`);
    revalidatePath("/staff/billing");

    return {
      status: "success",
      message: "Payment proof uploaded successfully. Staff verification is pending.",
      billId,
    };
  } catch (error) {
    if (uploadedProof?.publicId) {
      await deleteFromCloudinary(uploadedProof.publicId).catch(() => null);
    }

    const message = error instanceof Error ? error.message : "Upload failed.";
    return {
      status: "error",
      message: `Upload failed: ${message}. Re-select the screenshot and try again.`,
      billId,
    };
  }
}

export async function verifyPaymentProof(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");
  const notes = getOptionalString(formData, "notes");

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*, bills(id, invoice_kind, amount_due), readers(id, name, onboarding_completed)")
    .eq("id", transactionId)
    .maybeSingle();

  if (!transaction) {
    return;
  }

  await supabase
    .from("transactions")
    .update({
      verification_status: "verified",
      verification_notes: notes,
      verified_by_profile_id: profile.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  if (transaction.payment_proof_public_id) {
    await deleteFromCloudinary(transaction.payment_proof_public_id);
    await supabase
      .from("transactions")
      .update({
        payment_proof_url: null,
        payment_proof_public_id: null,
      })
      .eq("id", transactionId);
  }

  if (transaction.bills?.invoice_kind === "admission") {
    // Check if the bill is now fully paid after this verification
    const { data: updatedBill } = await supabase
      .from("bills")
      .select("status")
      .eq("id", transaction.bill_id)
      .single();

    if (updatedBill?.status === "paid") {
      await supabase
        .from("readers")
        .update({
          registration_paid: true,
          caution_paid: true,
          status: transaction.readers?.onboarding_completed ? "active" : "pending_onboarding",
        })
        .eq("id", transaction.reader_id);
    }
  }

  await notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Payment verified",
    body: "Your payment has been marked as paid.",
    link: "/student/payments",
  });

  const { data: reader } = await supabase
    .from("readers")
    .select("name, email")
    .eq("id", transaction.reader_id)
    .maybeSingle();

  if (reader?.email) {
    const emailTemplate = emailTemplates.paymentVerified({
      name: reader.name ?? "Student",
      invoiceId: transaction.bill_id,
      amountApplied: transaction.amount,
    });
    await sendEmail({
      to: [reader.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${transaction.bill_id ?? transactionId}`);
  revalidatePath("/staff/billing");
  return;
}

export async function rejectPaymentProof(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");
  const notes = getString(formData, "notes") || "Payment proof was rejected. Please upload a clearer screenshot.";

  const { data: transaction } = await supabase
    .from("transactions")
    .select("reader_id,bill_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (!transaction) {
    return;
  }

  await supabase
    .from("transactions")
    .update({
      verification_status: "rejected",
      verification_notes: notes,
      verified_by_profile_id: profile.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  await notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Payment proof rejected",
    body: notes,
    link: "/student/payments",
  });

  const { data: reader } = await supabase
    .from("readers")
    .select("name, email")
    .eq("id", transaction.reader_id)
    .maybeSingle();

  if (reader?.email) {
    const emailTemplate = emailTemplates.paymentRejected({
      name: reader.name ?? "Student",
      invoiceId: transaction.bill_id,
      reason: notes,
      reuploadLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/payments?invoiceId=${transaction.bill_id}`,
    });
    await sendEmail({
      to: [reader.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });
  }

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${transactionId}`);
  revalidatePath("/staff/billing");
  return;
}

export async function closeRejectedPaymentProof(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");

  const { data: transaction } = await supabase
    .from("transactions")
    .select("reader_id, payment_proof_public_id")
    .eq("id", transactionId)
    .maybeSingle();

  if (!transaction) {
    return;
  }

  if (transaction.payment_proof_public_id) {
    await deleteFromCloudinary(transaction.payment_proof_public_id);
  }

  await supabase
    .from("transactions")
    .update({
      verification_status: "closed",
      payment_proof_url: null,
      payment_proof_public_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  await notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Rejected proof closed",
    body: "The rejected proof has been closed. Upload a new screenshot if payment has been made.",
    link: "/student/payments",
  });

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
  return;
}

function resolveBillStatusForManualEdit(amountDue: number, amountPaid: number) {
  if (amountPaid >= amountDue && amountDue > 0) return "paid";
  if (amountPaid > 0 && amountPaid < amountDue) return "partial";
  return "pending";
}

export async function updateBillFromAdminAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const dueDate = getOptionalString(formData, "due_date");
  const baseAmount = getNumber(formData, "base_amount", 0);
  const registrationAmount = getNumber(formData, "registration_amount", 0);
  const cautionAmount = getNumber(formData, "caution_amount", 0);
  const amountDueInput = getOptionalString(formData, "amount_due");
  const adminStatus = getOptionalString(formData, "status");
  const note = getOptionalString(formData, "note");
  if (!billId) return;

  const { data: bill } = await supabase
    .from("bills")
    .select("id, amount_paid, amount_due, status")
    .eq("id", billId)
    .maybeSingle();
  if (!bill) return;

  const computedAmountDue =
    amountDueInput && Number.isFinite(Number(amountDueInput))
      ? Number(amountDueInput)
      : Math.max(0, baseAmount) + Math.max(0, registrationAmount) + Math.max(0, cautionAmount);
  const nextStatus =
    adminStatus && ["pending", "proof_submitted", "partial", "paid", "rejected_proof", "overdue"].includes(adminStatus)
      ? adminStatus
      : resolveBillStatusForManualEdit(computedAmountDue, Number(bill.amount_paid) || 0);

  await supabase
    .from("bills")
    .update({
      due_date: dueDate || null,
      base_amount: Math.max(0, baseAmount),
      registration_amount: Math.max(0, registrationAmount),
      caution_amount: Math.max(0, cautionAmount),
      amount_due: Math.max(0, computedAmountDue),
      status: nextStatus,
    })
    .eq("id", billId);

  // Update admission flags if this is an admission bill that is now paid
  const { data: billInfo } = await supabase
    .from("bills")
    .select("reader_id, invoice_kind")
    .eq("id", billId)
    .single();

  if (billInfo?.invoice_kind === "admission" && nextStatus === "paid") {
    const { data: reader } = await supabase
      .from("readers")
      .select("onboarding_completed")
      .eq("id", billInfo.reader_id)
      .single();

    await supabase
      .from("readers")
      .update({
        registration_paid: true,
        caution_paid: true,
        status: reader?.onboarding_completed ? "active" : "pending_onboarding",
      })
      .eq("id", billInfo.reader_id);
  }

  await supabase.from("bill_audit_logs").insert({
    bill_id: billId,
    actor_profile_id: profile.id,
    action: "bill_edit",
    notes: note || "Manual invoice edit",
    before_state: {
      amount_due: bill.amount_due,
      status: bill.status,
    },
    after_state: {
      amount_due: Math.max(0, computedAmountDue),
      status: nextStatus,
      due_date: dueDate || null,
      base_amount: Math.max(0, baseAmount),
      registration_amount: Math.max(0, registrationAmount),
      caution_amount: Math.max(0, cautionAmount),
    },
  });

  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${billId}`);
  revalidatePath("/student/payments");
}

export async function recordOfflinePaymentAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const amount = getNumber(formData, "amount", 0);
  const note = getOptionalString(formData, "note");
  const mode = getString(formData, "payment_mode") || "cash";
  if (!billId || amount <= 0) return;

  const normalizedMode = ["cash", "offline"].includes(mode) ? mode : "cash";

  const { data: bill } = await supabase
    .from("bills")
    .select("id, reader_id, invoice_kind")
    .eq("id", billId)
    .maybeSingle();
  if (!bill) return;

  await supabase.from("transactions").insert({
    reader_id: bill.reader_id,
    bill_id: bill.id,
    type: "offline",
    amount,
    payment_mode: normalizedMode,
    verification_status: "verified",
    verification_notes: note || `Offline payment received (${normalizedMode})`,
    submitted_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    verified_by_profile_id: profile.id,
  });
  
  // Update admission flags if this is an admission bill that is now paid
  if (bill.invoice_kind === "admission") {
    const { data: updatedBill } = await supabase
      .from("bills")
      .select("status")
      .eq("id", billId)
      .single();
      
    if (updatedBill?.status === "paid") {
      const { data: reader } = await supabase
        .from("readers")
        .select("onboarding_completed")
        .eq("id", bill.reader_id)
        .single();
        
      await supabase
        .from("readers")
        .update({
          registration_paid: true,
          caution_paid: true,
          status: reader?.onboarding_completed ? "active" : "pending_onboarding",
        })
        .eq("id", bill.reader_id);
    }
  }

  await supabase.from("bill_audit_logs").insert({
    bill_id: bill.id,
    actor_profile_id: profile.id,
    action: "offline_payment_received",
    notes: note || `Amount ${amount} via ${normalizedMode}`,
    before_state: {},
    after_state: { amount, payment_mode: normalizedMode },
  });

  await notifyReader(bill.reader_id, {
    category: "payment",
    title: "Offline payment recorded",
    body: `An offline payment of Rs ${amount} has been recorded to your invoice.`,
    link: "/student/payments",
  });

  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${bill.id}`);
  revalidatePath("/staff/billing");
  revalidatePath("/student/payments");
}

export async function addBillLedgerEntryAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const entryType = getString(formData, "entry_type");
  const amount = Math.max(0, getNumber(formData, "amount", 0));
  const note = getOptionalString(formData, "note");
  if (!billId || amount <= 0) return;
  if (!["refund", "manual_adjustment"].includes(entryType)) return;

  const { data: bill } = await supabase
    .from("bills")
    .select("id, reader_id, amount_due, amount_paid, status")
    .eq("id", billId)
    .maybeSingle();
  if (!bill) return;

  const delta = entryType === "refund" ? -amount : amount;
  const nextPaid = Math.max(0, (Number(bill.amount_paid) || 0) + delta);
  const nextStatus = resolveBillStatusForManualEdit(Number(bill.amount_due) || 0, nextPaid);

  await supabase.from("transactions").insert({
    reader_id: bill.reader_id,
    bill_id: bill.id,
    type: entryType,
    amount: delta,
    payment_mode: "upi",
    verification_status: "verified",
    verification_notes: note || (entryType === "refund" ? "Manual refund entry" : "Manual adjustment entry"),
    submitted_at: new Date().toISOString(),
    verified_at: new Date().toISOString(),
    verified_by_profile_id: profile.id,
  });

  await supabase
    .from("bills")
    .update({
      amount_paid: nextPaid,
      status: nextStatus,
    })
    .eq("id", bill.id);

  await supabase.from("bill_audit_logs").insert({
    bill_id: bill.id,
    actor_profile_id: profile.id,
    action: entryType,
    notes: note || null,
    before_state: {
      amount_paid: bill.amount_paid,
      status: bill.status,
    },
    after_state: {
      amount_paid: nextPaid,
      status: nextStatus,
      delta,
    },
  });

  await notifyReader(bill.reader_id, {
    category: "billing",
    title: entryType === "refund" ? "Refund processed" : "Billing adjustment posted",
    body:
      entryType === "refund"
        ? `A refund entry of Rs ${amount} was posted to your billing ledger.`
        : `A manual adjustment of Rs ${amount} was posted to your billing ledger.`,
    link: "/student/payments",
  });

  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${bill.id}`);
  revalidatePath("/student/payments");
}

export async function assignSeatFromMapAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const readerId = getString(formData, "reader_id");
  const seatId = getString(formData, "seat_id");
  if (!readerId || !seatId) return;

  const next = new FormData();
  next.set("reader_id", readerId);
  next.set("seat_id", seatId);
  await updateStudentSeatAction(next);

  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
}

export async function generateMonthlyInvoices() {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const settings = await getHubSettings();
  const { month, year } = getCurrentBillingPeriod();
  const today = new Date();
  const todayDate = getIsoDateOnly(today);
  const weekStartDate = getIsoDateOnly(getMondayOfCurrentWeek(today));

  const { data: students } = await supabase
    .from("readers")
    .select("id, name, email, monthly_fee, reader_type")
    .eq("status", "active");

  for (const student of students ?? []) {
    const planType = normalizePlanType(student.reader_type ?? "monthly");
    const planFee = Math.max(0, Number(student.monthly_fee) || planDefaultPrice(planType, settings));
    const dueDate =
      planType === "daily"
        ? todayDate
        : planType === "weekly"
          ? weekStartDate
          : new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const recurringTitle =
      planType === "daily"
        ? `Daily fee for ${dueDate}`
        : planType === "weekly"
          ? `Weekly fee for week of ${dueDate}`
          : `Monthly fee for ${new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long" })}`;
    const invoiceKind = planType === "monthly" ? "monthly_renewal" : "manual";

    let existingBillQuery = supabase
      .from("bills")
      .select("id")
      .eq("reader_id", student.id)
      .eq("due_date", dueDate)
      .eq("title", recurringTitle);

    if (planType === "monthly") {
      existingBillQuery = supabase
        .from("bills")
        .select("id")
        .eq("reader_id", student.id)
        .eq("month", month)
        .eq("year", year)
        .eq("invoice_kind", "monthly_renewal");
    }
    const { data: existingBill } = await existingBillQuery.maybeSingle();

    if (existingBill) {
      continue;
    }

    const invoice = calculateInvoiceAmount({
      planType,
      monthlyFee: planFee,
      includeAdmissionFees: false,
    });

    await supabase.from("bills").insert({
      reader_id: student.id,
      month,
      year,
      due_date: dueDate,
      invoice_kind: invoiceKind,
      title: recurringTitle,
      base_amount: invoice.baseAmount,
      registration_amount: 0,
      caution_amount: 0,
      amount_due: invoice.totalAmount,
      amount_paid: 0,
      status: "pending",
    });

    await notifyReader(student.id, {
      category: "billing",
      title: `${formatPlanLabel(planType)} payment due`,
      body: `Your ${formatPlanLabel(planType).toLowerCase()} fee of Rs ${invoice.totalAmount} is due. Please pay using the static UPI QR and upload the screenshot.`,
      link: "/student/payments",
    });

    if (student.email) {
      const monthLabel =
        planType === "daily"
          ? `Daily cycle ${dueDate}`
          : planType === "weekly"
            ? `Week of ${dueDate}`
            : new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      const emailTemplate = emailTemplates.monthlyDue({
        name: student.name,
        amount: invoice.totalAmount,
        monthLabel,
        qrUrl: settings.static_upi_qr_url,
        upiId: settings.static_upi_id,
      });
      await sendEmail({
        to: [student.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }
  }

  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
  revalidatePath("/student");
  return;
}

export async function createPostAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const rawType = getString(formData, "type");
  const isAnnouncement = rawType === "announcement";
  const type = isAnnouncement ? "note" : rawType;
  const audience = isAnnouncement ? "student" : getString(formData, "audience");
  const examCategory = getOptionalString(formData, "exam_category");
  const targetStatus = getOptionalString(formData, "target_status");
  const targetExamCategory = getOptionalString(formData, "target_exam_category");
  const onlyExamPreparing = getString(formData, "only_exam_preparing") === "yes";
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const status = getString(formData, "status") || "draft";

  if (!type || !audience || !title || !content) {
    return;
  }

  if (!["blog", "note", "job", "exam_alert"].includes(type)) {
    return;
  }

  const { data: post } = await supabase
    .from("posts")
    .insert({
      type,
      audience,
      exam_category: examCategory,
      title,
      summary,
      content,
      link_url: linkUrl,
      status,
      author_profile_id: profile.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (post && post.status === "published") {
    if (post.type === "exam_alert" && post.exam_category) {
      const { data: interestedStudents } = await supabase
        .from("student_exam_interests")
        .select("reader_id, readers(email)")
        .eq("category", post.exam_category);

      const readerIds = (interestedStudents ?? []).map((row) => row.reader_id);
      const emails = (interestedStudents ?? [])
        .map((row) => (row.readers as { email?: string } | null)?.email ?? "")
        .filter(Boolean);

      await Promise.all(
        readerIds.map((readerId) =>
          notifyReader(readerId, {
            category: "exam_alert",
            title: post.title,
            body: post.summary || "A new exam update has been published.",
            link: "/student/exams",
          }),
        ),
      );

      if (emails.length > 0) {
        const emailTemplate = emailTemplates.examAlert({
          title: post.title,
          category: post.exam_category,
          summary: post.summary,
          link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/exams`,
        });
        await sendEmailBatched({
          to: emails,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    } else if (isAnnouncement) {
      let targetedReaderIds: string[] | null = null;
      if (targetExamCategory) {
        const { data: interestRows } = await supabase
          .from("student_exam_interests")
          .select("reader_id")
          .eq("category", targetExamCategory);
        targetedReaderIds = (interestRows ?? []).map((row) => row.reader_id);
      }

      let readersQuery = supabase
        .from("readers")
        .select("id, email")
        .in("status", targetStatus ? [targetStatus] : ["active", "pending_payment", "pending_onboarding"])
        .not("email", "is", null);

      if (onlyExamPreparing) {
        readersQuery = readersQuery.eq("preparing_for_exam", true);
      }
      if (targetedReaderIds) {
        readersQuery =
          targetedReaderIds.length > 0
            ? readersQuery.in("id", targetedReaderIds)
            : readersQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
      }

      const { data: studentRows } = await readersQuery;

      const readerIds = (studentRows ?? []).map((row) => row.id);
      const emails = (studentRows ?? []).map((row) => row.email).filter(Boolean);

      await Promise.all(
        readerIds.map((readerId) =>
          notifyReader(readerId, {
            category: "announcement",
            title: post.title,
            body: post.summary || "A new student announcement has been posted.",
            link: "/student/announcements",
          }),
        ),
      );

      if (emails.length > 0) {
        const emailTemplate = emailTemplates.studentAnnouncement({
          title: post.title,
          summary: post.summary,
          link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/announcements`,
        });
        await sendEmailBatched({
          to: emails,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }

      await supabase
        .from("posts")
        .update({
          summary: post.summary || `Delivered to ${readerIds.length} students via portal and ${emails.length} emails.`,
        })
        .eq("id", post.id);
    } else if (post.type === "blog" || post.type === "note" || post.type === "job") {
      const { data: activeReaders } = await supabase
        .from("readers")
        .select("email")
        .eq("status", "active")
        .not("email", "is", null);

      const emails = (activeReaders ?? []).map((r) => r.email).filter(Boolean);
      if (emails.length > 0) {
        const emailTemplate = emailTemplates.postPublished({
          title: post.title,
          type: post.type as "blog" | "note" | "job",
          summary: post.summary,
          link:
            post.link_url ||
            `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}${
              post.type === "blog"
                ? "/blogs"
                : post.type === "job"
                  ? "/job-opportunities"
                  : "/notes"
            }`,
        });
        await sendEmailBatched({
          to: emails,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });
      }
    }
  }

  revalidatePath("/super-admin/content");
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
  return;
}

export async function createBlogPostAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const status = getString(formData, "status") || "draft";
  const coverImage = getFile(formData, "cover_image");

  if (!title || !content) return;
  if (!["draft", "published"].includes(status)) return;

  let uploadedCover: { secureUrl: string; publicId: string } | null = null;

  if (coverImage) {
    uploadedCover = await uploadToCloudinary(coverImage, "bodhi-blog-covers");
  }

  const { data: post } = await supabase
    .from("posts")
    .insert({
      type: "blog",
      audience: "public",
      title,
      summary,
      content,
      link_url: linkUrl,
      cover_image_url: uploadedCover?.secureUrl ?? null,
      cover_image_public_id: uploadedCover?.publicId ?? null,
      status,
      author_profile_id: profile.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (post?.status === "published") {
    await deliverPublishedPostUpdate({
      type: "blog",
      audience: "public",
      title: post.title,
      summary: post.summary,
      link_url: post.link_url,
    });
  }

  revalidatePath("/super-admin/content");
  revalidatePath("/staff/content");
  revalidatePath("/blogs");
  revalidatePath("/");
}

async function deliverPublishedPostUpdate(post: {
  type: "blog" | "note" | "job" | "exam_alert";
  audience: "public" | "student";
  exam_category?: string | null;
  title: string;
  summary: string | null;
  link_url?: string | null;
}) {
  const supabase = createAdminClient();

  if (post.type === "exam_alert" && post.exam_category) {
    const { data: interestedStudents } = await supabase
      .from("student_exam_interests")
      .select("reader_id, readers(email)")
      .eq("category", post.exam_category);

    const readerIds = (interestedStudents ?? []).map((row) => row.reader_id);
    const emails = (interestedStudents ?? [])
      .map((row) => (row.readers as { email?: string } | null)?.email ?? "")
      .filter(Boolean);

    await Promise.all(
      readerIds.map((readerId) =>
        notifyReader(readerId, {
          category: "exam_alert",
          title: post.title,
          body: post.summary || "A new exam update has been published.",
          link: "/student/exams",
        }),
      ),
    );

    if (emails.length > 0) {
      const emailTemplate = emailTemplates.examAlert({
        title: post.title,
        category: post.exam_category,
        summary: post.summary,
        link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/exams`,
      });
      await sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }
    return;
  }

  if (post.audience === "student") {
    const { data: studentRows } = await supabase
      .from("readers")
      .select("id, email")
      .in("status", ["active", "pending_payment", "pending_onboarding"])
      .not("email", "is", null);

    const readerIds = (studentRows ?? []).map((row) => row.id);
    const emails = (studentRows ?? []).map((row) => row.email).filter(Boolean);

    await Promise.all(
      readerIds.map((readerId) =>
        notifyReader(readerId, {
          category: "announcement",
          title: post.title,
          body: post.summary || "A new student announcement has been posted.",
          link: "/student/announcements",
        }),
      ),
    );

    if (emails.length > 0) {
      const emailTemplate = emailTemplates.studentAnnouncement({
        title: post.title,
        summary: post.summary,
        link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/announcements`,
      });
      await sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }
    return;
  }

  if (post.type === "blog" || post.type === "note" || post.type === "job") {
    const { data: activeReaders } = await supabase
      .from("readers")
      .select("email")
      .eq("status", "active")
      .not("email", "is", null);

    const emails = (activeReaders ?? []).map((r) => r.email).filter(Boolean);
    if (emails.length > 0) {
      const emailTemplate = emailTemplates.postPublished({
        title: post.title,
        type: post.type as "blog" | "note" | "job",
        summary: post.summary,
        link:
          post.link_url ||
          `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}${
            post.type === "blog"
              ? "/blogs"
              : post.type === "job"
                ? "/job-opportunities"
                : "/notes"
          }`,
      });
      await sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }
  }
}

export async function updatePostAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const type = getString(formData, "type");
  const audience = getString(formData, "audience");
  const examCategory = getOptionalString(formData, "exam_category");
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const coverImage = getFile(formData, "cover_image");
  const status = getString(formData, "status");

  if (!postId || !type || !audience || !title || !content) return;
  if (!["blog", "note", "job", "exam_alert"].includes(type)) return;
  if (!["public", "student"].includes(audience)) return;
  if (!["draft", "published", "archived"].includes(status)) return;

  const { data: previous } = await supabase
    .from("posts")
    .select("status, cover_image_public_id")
    .eq("id", postId)
    .maybeSingle();

  let nextCoverImageUrl: string | null | undefined = undefined;
  let nextCoverImagePublicId: string | null | undefined = undefined;

  if (coverImage && type === "blog") {
    const uploadedCover = await uploadToCloudinary(coverImage, "bodhi-blog-covers");
    nextCoverImageUrl = uploadedCover.secureUrl;
    nextCoverImagePublicId = uploadedCover.publicId;

    if (previous?.cover_image_public_id) {
      await deleteFromCloudinary(previous.cover_image_public_id);
    }
  }

  await supabase
    .from("posts")
    .update({
      type,
      audience,
      exam_category: examCategory,
      title,
      summary,
      content,
      link_url: linkUrl,
      ...(type === "blog" && nextCoverImageUrl !== undefined
        ? {
            cover_image_url: nextCoverImageUrl,
            cover_image_public_id: nextCoverImagePublicId ?? null,
          }
        : {}),
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (status === "published" && previous?.status !== "published") {
    await deliverPublishedPostUpdate({
      type: type as "blog" | "note" | "job" | "exam_alert",
      link_url: linkUrl,
      audience: audience as "public" | "student",
      exam_category: examCategory,
      title,
      summary,
    });
  }

  revalidatePath("/super-admin/content");
  revalidatePath(`/super-admin/content/${postId}`);
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
}

export async function quickUpdatePostStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const status = getString(formData, "status");
  if (!postId || !["draft", "published", "archived"].includes(status)) return;

  const { data: previous } = await supabase
    .from("posts")
    .select("status, type, audience, exam_category, title, summary, link_url")
    .eq("id", postId)
    .maybeSingle();

  await supabase
    .from("posts")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", postId);

  if (status === "published" && previous && previous.status !== "published") {
    await deliverPublishedPostUpdate({
      type: previous.type as "blog" | "note" | "job" | "exam_alert",
      link_url: previous.link_url,
      audience: previous.audience as "public" | "student",
      exam_category: previous.exam_category,
      title: previous.title,
      summary: previous.summary,
    });
  }

  revalidatePath("/super-admin/content");
  revalidatePath(`/super-admin/content/${postId}`);
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
}

export async function createCalendarEventAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const description = getOptionalString(formData, "description") ?? "";
  const eventType = getString(formData, "event_type");
  const audience = getString(formData, "audience") || "student";
  const examCategory = getOptionalString(formData, "exam_category");
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const location = getOptionalString(formData, "location");
  const linkUrl = getOptionalString(formData, "link_url");
  const sourcePostId = getOptionalString(formData, "source_post_id");
  const status = getString(formData, "status") || "draft";

  if (!title || !startsAt) return;
  if (!CALENDAR_EVENT_TYPES.has(eventType)) return;
  if (!CALENDAR_EVENT_AUDIENCES.has(audience)) return;
  if (!CALENDAR_EVENT_STATUSES.has(status)) return;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) return;

  await supabase.from("calendar_events").insert({
    title,
    summary,
    description,
    event_type: eventType,
    audience,
    exam_category: examCategory,
    starts_at: startsAt,
    ends_at: endsAt,
    is_all_day: isAllDay,
    location,
    link_url: linkUrl,
    source_post_id: sourcePostId,
    status,
    author_profile_id: profile.id,
  });

  revalidateCalendarPaths();
}

export async function updateCalendarEventAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const eventId = getString(formData, "event_id");
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const description = getOptionalString(formData, "description") ?? "";
  const eventType = getString(formData, "event_type");
  const audience = getString(formData, "audience") || "student";
  const examCategory = getOptionalString(formData, "exam_category");
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const location = getOptionalString(formData, "location");
  const linkUrl = getOptionalString(formData, "link_url");
  const sourcePostId = getOptionalString(formData, "source_post_id");
  const status = getString(formData, "status") || "draft";

  if (!eventId || !title || !startsAt) return;
  if (!CALENDAR_EVENT_TYPES.has(eventType)) return;
  if (!CALENDAR_EVENT_AUDIENCES.has(audience)) return;
  if (!CALENDAR_EVENT_STATUSES.has(status)) return;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) return;

  await supabase
    .from("calendar_events")
    .update({
      title,
      summary,
      description,
      event_type: eventType,
      audience,
      exam_category: examCategory,
      starts_at: startsAt,
      ends_at: endsAt,
      is_all_day: isAllDay,
      location,
      link_url: linkUrl,
      source_post_id: sourcePostId,
      status,
    })
    .eq("id", eventId);

  revalidateCalendarPaths();
}

export async function deleteCalendarEventAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const eventId = getString(formData, "event_id");
  if (!eventId) return;

  await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId);

  revalidateCalendarPaths();
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

  const { data: existingSeats } = await supabase
    .from("seats")
    .select("id, seat_number");
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
    if (toInsert.length > 0) {
      await supabase.from("seats").insert(toInsert);
    }
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
    enquiry_notification_emails: getString(formData, "enquiry_notification_emails")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    billing_notification_emails: getString(formData, "billing_notification_emails")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    allowed_attendance_ips: getString(formData, "allowed_attendance_ips")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);

  revalidatePath("/super-admin/settings");
  revalidatePath("/super-admin/seats");
  revalidatePath("/");
  return;
}

export async function resetAllDataAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const confirmation = getString(formData, "confirm").toLowerCase();

  if (confirmation !== "reset") {
    return;
  }

  // Clear dependent tables — only tables that exist in the deployed schema
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

  // Reset seats to a clean state
  await supabase
    .from("seats")
    .update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      blocked_until: null,
      linked_enquiry_id: null,
    })
    .not("id", "is", null);

  // Collect non-admin IDs BEFORE deleting profiles
  // (avoids calling listUsers() which can trigger Supabase auth rate limiting)
  const { data: nonAdminProfiles } = await supabase
    .from("profiles")
    .select("id")
    .neq("role", "super_admin");
  const nonAdminIds = (nonAdminProfiles ?? [])
    .map((p) => p.id)
    .filter((id) => id !== profile.id);

  // Remove non-admin profiles
  await supabase.from("profiles").delete().neq("role", "super_admin");

  // Delete auth users sequentially by known ID — avoids listUsers() rate limit issues
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

  if (!fullName || !email) {
    return;
  }

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !authData.user) {
    return;
  }

  await supabase.from("profiles").upsert({
    id: authData.user.id,
    full_name: fullName,
    role: "staff",
    onboarding_required: false,
  });

  const staffEmail = emailTemplates.staffAccount({ name: fullName, email, password });
  await sendEmail({
    to: [email],
    subject: staffEmail.subject,
    html: staffEmail.html,
    text: staffEmail.text,
  });

  revalidatePath("/super-admin/staff");
  return;
}

export async function updateStaffProfileAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const staffId = getString(formData, "staff_id");
  const fullName = getString(formData, "full_name");
  const role = getString(formData, "role");

  if (!staffId || !fullName) return;
  if (!["staff", "super_admin"].includes(role)) return;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", staffId)
    .maybeSingle();

  if (!targetProfile) return;

  // Prevent accidental lockout of current operator.
  if (profile.id === staffId && role !== "super_admin") return;

  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
    })
    .eq("id", staffId);

  await notifyActor(
    staffId,
    "Account updated",
    `Your profile was updated by admin. Role: ${role}.`,
    role === "super_admin" ? "/super-admin" : "/staff",
  );

  revalidatePath("/super-admin/staff");
  revalidatePath(`/super-admin/staff/${staffId}`);
  revalidatePath("/super-admin");
}

export async function removeStaffAccountAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const staffId = getString(formData, "staff_id");
  if (!staffId) return;

  // Never allow deleting your own super-admin account from this flow.
  if (staffId === profile.id) return;

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", staffId)
    .maybeSingle();

  if (!targetProfile) return;
  if (targetProfile.role !== "staff") return;

  await supabase.auth.admin.deleteUser(staffId);

  revalidatePath("/super-admin/staff");
  revalidatePath(`/super-admin/staff/${staffId}`);
  revalidatePath("/super-admin");
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
  return;
}

export async function toggleTodoItemAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const todoId = getString(formData, "todo_id");
  const completed = getString(formData, "completed") === "true";

  await supabase
    .from("todo_items")
    .update({ is_completed: !completed })
    .eq("id", todoId)
    .eq("reader_id", student.id);

  revalidatePath("/student");
  return;
}

export async function deleteTodoItemAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const todoId = getString(formData, "todo_id");
  if (!todoId) return;

  await supabase
    .from("todo_items")
    .delete()
    .eq("id", todoId)
    .eq("reader_id", student.id);

  revalidatePath("/student");
  return;
}

export async function toggleSavedPostAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const shouldSave = getString(formData, "save") !== "no";
  if (!postId) return;

  const { data: post } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.status !== "published") return;

  await supabase
    .from("student_post_activity")
    .upsert(
      {
        reader_id: student.id,
        post_id: postId,
        is_saved: shouldSave,
      },
      { onConflict: "reader_id,post_id" },
    );

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

  const { data: post } = await supabase
    .from("posts")
    .select("id, status")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.status !== "published") return;

  const now = new Date();
  await supabase
    .from("student_post_activity")
    .upsert(
      {
        reader_id: student.id,
        post_id: postId,
        is_saved: true,
        is_revised: mode === "revised",
        revised_at: mode === "revised" ? now.toISOString() : null,
        revision_due_on: mode === "revised" ? getIsoDateOnly(addDays(now, 7)) : getIsoDateOnly(now),
      },
      { onConflict: "reader_id,post_id" },
    );

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

export async function markNotificationReadAction(formData: FormData) {
  const { student, profile } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const notificationId = getString(formData, "notification_id");
  if (!notificationId) return;

  const { data: notification } = await supabase
    .from("notifications")
    .select("id, audience_type, audience_id, metadata")
    .eq("id", notificationId)
    .maybeSingle();

  if (!notification) return;

  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;
  const isForStudent =
    (notification.audience_type === "reader" && notification.audience_id === student.id) ||
    (notification.audience_type === "profile" && notification.audience_id === profile.id) ||
    (notification.audience_type === "broadcast_role" && metadata.role === "student");

  if (!isForStudent) return;

  await supabase
    .from("notification_reads")
    .upsert(
      {
        notification_id: notificationId,
        profile_id: profile.id,
        read_at: new Date().toISOString(),
      },
      { onConflict: "notification_id,profile_id" },
    );

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
    await supabase
      .from("notification_reads")
      .upsert(
        eligibleIds.map((notificationId) => ({
          notification_id: notificationId,
          profile_id: profile.id,
          read_at: new Date().toISOString(),
        })),
        { onConflict: "notification_id,profile_id" },
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

  const nowIso = new Date().toISOString();
  const plannedExitIso = new Date(plannedExit).toISOString();

  const { data: existingActive } = await supabase
    .from("night_logs")
    .select("id")
    .eq("reader_id", student.id)
    .eq("status", "active")
    .maybeSingle();

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

  const { data: nightLog } = await supabase
    .from("night_logs")
    .select("id, reader_id, planned_exit_time")
    .eq("id", nightLogId)
    .eq("reader_id", student.id)
    .maybeSingle();

  if (!nightLog) return;

  const now = new Date();
  const plannedExit = new Date(nightLog.planned_exit_time);
  const status = now > plannedExit ? "late" : "completed";

  await supabase
    .from("night_logs")
    .update({
      actual_exit_time: now.toISOString(),
      status,
    })
    .eq("id", nightLog.id);

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
    last_reply_at: new Date().toISOString(),
  });

  const profileIds = await getStaffAndAdminProfileIds();
  await notifyProfileIds(profileIds, {
    category: "account",
    title: `Support ticket: ${subject}`,
    body: `${student.name}: ${message}`,
    link: "/staff/support",
  });

  const settings = await getHubSettings();
  if (settings.enquiry_notification_emails.length > 0) {
    await sendEmail({
      to: settings.enquiry_notification_emails,
      subject: `Student support ticket: ${subject}`,
      html: `<p><strong>Student:</strong> ${student.name} (${student.email ?? "no-email"})</p><p>${message}</p>`,
    });
  }

  await notifyReader(student.id, {
    category: "account",
    title: "Support ticket received",
    body: "Your issue has been logged. Track its status from your dashboard.",
    link: "/student",
  });

  revalidateSupportPaths();
  return successState("Your support request has been received. Staff will review it shortly.");
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const ticketId = getString(formData, "ticket_id");
  const status = getString(formData, "status");

  if (!ticketId || !SUPPORT_TICKET_STATUSES.has(status)) return;

  const { data: ticket } = await supabase
    .from("student_support_tickets")
    .select("id, reader_id, subject, status")
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) return;

  const now = new Date().toISOString();
  await supabase
    .from("student_support_tickets")
    .update({
      status,
      last_reply_at: now,
      resolved_at: status === "resolved" || status === "closed" ? now : null,
    })
    .eq("id", ticketId);

  if (ticket.status !== status) {
    await notifyReader(ticket.reader_id, {
      category: "account",
      title: "Support ticket updated",
      body: `"${ticket.subject}" is now ${status.replaceAll("_", " ")}.`,
      link: "/student",
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

  const { data: existingExit } = await supabase
    .from("exit_requests")
    .select("id")
    .eq("reader_id", student.id)
    .in("status", ["pending"])
    .maybeSingle();

  if (existingExit) return errorState("You already have a pending exit request.");

  await supabase.from("exit_requests").insert({
    reader_id: student.id,
    exit_date: exitDate,
    refund_eligible: student.caution_paid === true,
    status: "pending",
  });

  const profileIds = await getStaffAndAdminProfileIds();
  await notifyProfileIds(profileIds, {
    category: "account",
    title: "New Exit Request",
    body: `${student.name} requested an exit on ${exitDate}.`,
    link: "/staff/exit-requests",
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

  const { data: exitRequest } = await supabase
    .from("exit_requests")
    .select("*, readers(*)")
    .eq("id", exitRequestId)
    .maybeSingle();

  if (!exitRequest || exitRequest.status !== "pending") return;
  const studentRecord = Array.isArray(exitRequest.readers)
    ? exitRequest.readers[0]
    : exitRequest.readers;
  const student = (studentRecord ?? null) as {
    id: string;
    name: string;
    email?: string | null;
    fixed_seat_id?: string | null;
    caution_refunded?: boolean;
  } | null;
  if (!student) return;

  await supabase
    .from("exit_requests")
    .update({ 
      status: "processed", 
      admin_notes: adminNotes 
    })
    .eq("id", exitRequestId)
    .eq("status", "pending");

  await supabase
    .from("readers")
    .update({
      status: "archived",
      caution_refunded: exitRequest.refund_eligible ? true : student.caution_refunded,
    })
    .eq("id", exitRequest.reader_id);

  if (student.fixed_seat_id) {
    await supabase.from("seats").update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    }).eq("id", student.fixed_seat_id);
  }

  if (exitRequest.refund_eligible && student.email) {
    const refundEmail = emailTemplates.cautionRefund({
      name: student.name,
      amount: 300,
      method: "UPI / NEFT",
      processedAt: new Date().toISOString().slice(0, 10),
    });

    await sendEmail({
      to: [student.email],
      subject: refundEmail.subject,
      html: refundEmail.html,
      text: refundEmail.text,
    });
  }

  await notifyReader(student.id, {
    category: "account",
    title: "Exit request processed",
    body: "Your exit has been processed, and seat has been released.",
    link: "/student/profile"
  });

  revalidatePath("/student");
  revalidatePath("/super-admin/exit-requests");
  revalidatePath(`/super-admin/exit-requests/${exitRequestId}`);
  revalidatePath("/staff/exit-requests");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  return;
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

  const { data: exitRequest } = await supabase
    .from("exit_requests")
    .select("id, status, reader_id")
    .eq("id", exitRequestId)
    .maybeSingle();
  if (!exitRequest || exitRequest.status !== "pending") return;

  await supabase
    .from("exit_requests")
    .update({
      status: "rejected",
      admin_notes: adminNotes,
    })
    .eq("id", exitRequestId)
    .eq("status", "pending");

  await notifyReader(exitRequest.reader_id, {
    category: "account",
    title: "Exit request rejected",
    body: "Your exit request was rejected by admin. Contact staff for clarification.",
    link: "/student/profile",
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

  const { data: reader } = await supabase
    .from("readers")
    .select("id, name, email, status, reader_type, caution_refunded, fixed_seat_id, monthly_fee, onboarding_completed, join_date")
    .eq("id", readerId)
    .maybeSingle();

  if (!reader) return;

  // Avoid creating duplicate open payable invoices.
  const { data: openBill } = await supabase
    .from("bills")
    .select("id")
    .eq("reader_id", reader.id)
    .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
    .maybeSingle();

  let seatIdToAssign = reader.fixed_seat_id;
  if (seatIdToAssign) {
    const { data: existingSeat } = await supabase
      .from("seats")
      .select("id, status")
      .eq("id", seatIdToAssign)
      .maybeSingle();
    if (!existingSeat || existingSeat.status !== "available") {
      seatIdToAssign = null;
    }
  }

  if (!seatIdToAssign) {
    const { data: nextSeat } = await supabase
      .from("seats")
      .select("id")
      .eq("status", "available")
      .order("seat_number", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!nextSeat) return;
    seatIdToAssign = nextSeat.id;
  }

  await supabase
    .from("seats")
    .update({
      status: "occupied",
      assigned_reader_id: reader.id,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    })
    .eq("id", seatIdToAssign);

  await supabase
    .from("readers")
    .update({
      status: "pending_payment",
      fixed_seat_id: seatIdToAssign,
      caution_refunded: false,
      caution_paid: false,
      registration_paid: false,
      join_date: new Date().toISOString(),
    })
    .eq("id", reader.id);

  if (!openBill) {
    const settings = await getHubSettings();
    const planType = normalizePlanType(reader.reader_type ?? "monthly");
    const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
    const invoice =
      planType === "monthly"
        ? calculateMonthlyAdmissionAmount(new Date(), planFee)
        : calculateInvoiceAmount({
            planType,
            monthlyFee: planFee,
            includeAdmissionFees: false,
            joinDate: new Date(),
          });
    const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, new Date()) : false;
    const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
    const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
    const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

    // Use `manual` to avoid collision with old admission uniqueness (reader_id, month, year, invoice_kind).
    const { error: billInsertError } = await supabase.from("bills").insert({
      reader_id: reader.id,
      month: null,
      year: null,
      due_date: new Date().toISOString().slice(0, 10),
      invoice_kind: "manual",
      title: "Rejoin admission invoice",
      base_amount: invoice.baseAmount,
      registration_amount: registrationAmount,
      caution_amount: cautionAmount,
      prorated_days: (invoice as { remainingDays?: number }).remainingDays ?? null,
      amount_due: totalAmount,
      amount_paid: 0,
      status: "pending",
    });

    if (billInsertError) {
      console.error("[rejoinStudentAction] bill insert failed:", billInsertError.message);
      return;
    }

    await notifyReader(reader.id, {
      category: "billing",
      title: "Payment due after rejoin",
      body: `Your rejoin ${formatPlanLabel(planType).toLowerCase()} invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`,
      link: "/student/payments",
    });
  }

  await notifyReader(reader.id, {
    category: "account",
    title: "Rejoin approved",
    body: "Your access has been restored. Complete payment to reactivate your dashboard.",
    link: "/student/payments",
  });

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

  const { data: reader } = await supabase
    .from("readers")
    .select("id, status, reader_type, monthly_fee, join_date")
    .eq("id", readerId)
    .maybeSingle();

  if (!reader || reader.status !== "pending_payment") return;

  const { data: openBill } = await supabase
    .from("bills")
    .select("id")
    .eq("reader_id", reader.id)
    .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
    .maybeSingle();

  if (openBill) return;

  const settings = await getHubSettings();
  const planType = normalizePlanType(reader.reader_type ?? "monthly");
  const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
  const invoice =
    planType === "monthly"
      ? calculateMonthlyAdmissionAmount(new Date(), planFee)
      : calculateInvoiceAmount({
          planType,
          monthlyFee: planFee,
          includeAdmissionFees: false,
          joinDate: new Date(),
        });
  const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, new Date()) : false;
  const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
  const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
  const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

  const { error: createBillError } = await supabase.from("bills").insert({
    reader_id: reader.id,
    month: null,
    year: null,
    due_date: new Date().toISOString().slice(0, 10),
    invoice_kind: "manual",
    title: "Rejoin admission invoice",
    base_amount: invoice.baseAmount,
    registration_amount: registrationAmount,
    caution_amount: cautionAmount,
    prorated_days: (invoice as { remainingDays?: number }).remainingDays ?? null,
    amount_due: totalAmount,
    amount_paid: 0,
    status: "pending",
  });

  if (createBillError) {
    console.error("[createRejoinInvoiceAction] bill insert failed:", createBillError.message);
    return;
  }

  await notifyReader(reader.id, {
    category: "billing",
    title: "Payment due",
    body: `Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`,
    link: "/student/payments",
  });

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}

export async function bulkUpdateStudentStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerIds = getStringArray(formData, "reader_ids");
  const status = getString(formData, "status");
  if (!status || readerIds.length === 0 || !MANAGEABLE_STUDENT_STATUSES.has(status)) return;

  await supabase
    .from("readers")
    .update({ status })
    .in("id", readerIds);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function bulkCreateRejoinInvoicesAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerIds = getStringArray(formData, "reader_ids");
  if (readerIds.length === 0) return;

  const { data: readers } = await supabase
    .from("readers")
    .select("id, status, reader_type, monthly_fee, join_date")
    .in("id", readerIds)
    .eq("status", "pending_payment");
  const settings = await getHubSettings();

  for (const reader of readers ?? []) {
    const { data: openBill } = await supabase
      .from("bills")
      .select("id")
      .eq("reader_id", reader.id)
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
      .maybeSingle();

    if (openBill) continue;

    const planType = normalizePlanType(reader.reader_type ?? "monthly");
    const planFee = Number(reader.monthly_fee) || planDefaultPrice(planType, settings);
    const invoice =
      planType === "monthly"
        ? calculateMonthlyAdmissionAmount(new Date(), planFee)
        : calculateInvoiceAmount({
            planType,
            monthlyFee: planFee,
            includeAdmissionFees: false,
            joinDate: new Date(),
          });
    const registrationApplicable = planType === "monthly" ? isRegistrationFeeApplicable(reader.join_date, new Date()) : false;
    const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
    const cautionAmount = planType === "monthly" ? invoice.cautionAmount : 0;
    const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

    await supabase.from("bills").insert({
      reader_id: reader.id,
      month: null,
      year: null,
      due_date: new Date().toISOString().slice(0, 10),
      invoice_kind: "manual",
      title: "Rejoin admission invoice",
      base_amount: invoice.baseAmount,
      registration_amount: registrationAmount,
      caution_amount: cautionAmount,
      prorated_days: (invoice as { remainingDays?: number }).remainingDays ?? null,
      amount_due: totalAmount,
      amount_paid: 0,
      status: "pending",
    });

    await notifyReader(reader.id, {
      category: "billing",
      title: "Payment due",
      body: `Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`,
      link: "/student/payments",
    });
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

  await Promise.all(
    readerIds.map((readerId) =>
      notifyReader(readerId, {
        category: "account",
        title,
        body,
        link: link || "/student",
      }),
    ),
  );

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function bulkStudentBatchAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const operation = getString(formData, "operation");

  if (operation === "status") {
    await bulkUpdateStudentStatusAction(formData);
    return;
  }
  if (operation === "invoice") {
    await bulkCreateRejoinInvoicesAction(formData);
    return;
  }
  if (operation === "note") {
    await bulkSendStudentAdminNoteAction(formData);
  }
}

export async function sendStudentAdminNoteAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const readerId = getString(formData, "reader_id");
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const link = getOptionalString(formData, "link");
  if (!readerId || !title || !body) return;

  await notifyReader(readerId, {
    category: "account",
    title,
    body,
    link: link || "/student",
  });

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

const MANAGEABLE_STUDENT_STATUSES = new Set([
  "pending_payment",
  "pending_onboarding",
  "active",
  "inactive",
  "waitlist",
  "rejected",
  "archived",
]);

export async function updateStudentStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const status = getString(formData, "status");
  if (!readerId || !MANAGEABLE_STUDENT_STATUSES.has(status)) return;

  await supabase
    .from("readers")
    .update({ status })
    .eq("id", readerId);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function updateStudentMonthlyFeeAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const monthlyFee = getNumber(formData, "monthly_fee", 0);
  if (!readerId || monthlyFee <= 0) return;

  await supabase
    .from("readers")
    .update({ monthly_fee: monthlyFee })
    .eq("id", readerId);

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

  const { data: reader } = await supabase
    .from("readers")
    .select("id,user_id,name,email,reader_type,status,monthly_fee,registration_paid,caution_paid,join_date")
    .eq("id", readerId)
    .maybeSingle();
  if (!reader) return;

  if (!reader.email) {
    await notifyActor(profile.id, "Conversion blocked", "Student email is mandatory to convert to monthly.");
    return;
  }
  if (normalizePlanType(reader.reader_type ?? "monthly") === "monthly") {
    await notifyActor(profile.id, "No change", "Student is already on monthly plan.");
    return;
  }

  const { data: openBill } = await supabase
    .from("bills")
    .select("id")
    .eq("reader_id", reader.id)
    .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
    .maybeSingle();
  if (openBill) {
    await notifyActor(profile.id, "Conversion blocked", "Close existing open invoice(s) before converting to monthly.");
    return;
  }

  let userId = reader.user_id;
  if (!userId) {
    const password = `Bodhi${randomBytes(4).toString("hex")}!`;
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: reader.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: reader.name },
    });

    if (createUserError) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find((user) => user.email === reader.email);
      if (!existingUser) {
        await notifyActor(profile.id, "Conversion failed", `Could not create monthly portal login for ${reader.email}.`);
        return;
      }
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: reader.name },
      });
      userId = existingUser.id;
    } else {
      userId = createdUser.user?.id ?? null;
    }

    if (!userId) {
      await notifyActor(profile.id, "Conversion failed", "Could not resolve auth user for this student.");
      return;
    }

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: reader.name,
      role: "student",
      onboarding_required: true,
    });

    const credentialEmail = emailTemplates.credentials({
      name: reader.name,
      email: reader.email,
      password,
    });
    await sendEmail({
      to: [reader.email],
      subject: credentialEmail.subject,
      html: credentialEmail.html,
      text: credentialEmail.text,
    });
  }

  const invoice = calculateMonthlyAdmissionAmount(new Date(), monthlyFee);
  const registrationApplicable = !reader.registration_paid && isRegistrationFeeApplicable(reader.join_date, new Date());
  const registrationAmount = registrationApplicable ? invoice.registrationAmount : 0;
  const cautionAmount = reader.caution_paid ? 0 : invoice.cautionAmount;
  const totalAmount = invoice.baseAmount + registrationAmount + cautionAmount;

  const { error: createBillError } = await supabase.from("bills").insert({
    reader_id: reader.id,
    month: null,
    year: null,
    due_date: getIsoDateOnly(new Date()),
    invoice_kind: "manual",
    title: "Monthly conversion invoice",
    base_amount: invoice.baseAmount,
    registration_amount: registrationAmount,
    caution_amount: cautionAmount,
    prorated_days: invoice.remainingDays ?? null,
    amount_due: totalAmount,
    amount_paid: 0,
    status: "pending",
  });
  if (createBillError) {
    await notifyActor(profile.id, "Conversion failed", createBillError.message || "Could not create monthly conversion invoice.");
    return;
  }

  await supabase
    .from("readers")
    .update({
      user_id: userId,
      reader_type: "monthly",
      monthly_fee: monthlyFee,
      status: "pending_payment",
      onboarding_completed: true,
      credentials_sent_at: new Date().toISOString(),
    })
    .eq("id", reader.id);

  await notifyReader(reader.id, {
    category: "billing",
    title: "Monthly conversion invoice created",
    body: `You have been upgraded to monthly plan. Your invoice of Rs ${totalAmount} is pending. Upload payment proof after UPI transfer.`,
    link: "/student/payments",
  });

  revalidatePath("/super-admin/students");
  revalidatePath(`/super-admin/students/${reader.id}`);
  revalidatePath("/staff/students");
  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
  revalidatePath("/student");
  revalidatePath("/student/payments");
}

export async function updateStudentSeatAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const requestedSeatId = getOptionalString(formData, "seat_id");
  if (!readerId) return;

  const { data: reader } = await supabase
    .from("readers")
    .select("id, fixed_seat_id")
    .eq("id", readerId)
    .maybeSingle();
  if (!reader) return;

  const currentSeatId = reader.fixed_seat_id;

  if (!requestedSeatId) {
    if (currentSeatId) {
      await supabase
        .from("seats")
        .update({ status: "available", assigned_reader_id: null })
        .eq("id", currentSeatId);

      await supabase.from("seat_shift_logs").insert({
        reader_id: readerId,
        old_seat_id: currentSeatId,
        new_seat_id: null,
        reason: "Seat released by admin",
      });
    }
    await supabase
      .from("readers")
      .update({ fixed_seat_id: null })
      .eq("id", readerId);

    revalidatePath("/super-admin/students");
    revalidatePath("/staff/students");
    return;
  }

  if (currentSeatId === requestedSeatId) {
    return;
  }

  const { data: targetSeat } = await supabase
    .from("seats")
    .select("id, status, assigned_reader_id")
    .eq("id", requestedSeatId)
    .maybeSingle();

  if (!targetSeat) return;
  const isSeatFree = targetSeat.status === "available" || targetSeat.assigned_reader_id === readerId;
  if (!isSeatFree) return;

  if (currentSeatId) {
    await supabase
      .from("seats")
      .update({ status: "available", assigned_reader_id: null })
      .eq("id", currentSeatId);
  }

  await supabase
    .from("seats")
    .update({ status: "occupied", assigned_reader_id: readerId })
    .eq("id", requestedSeatId);

  await supabase
    .from("readers")
    .update({ fixed_seat_id: requestedSeatId })
    .eq("id", readerId);

  await supabase.from("seat_shift_logs").insert({
    reader_id: readerId,
    old_seat_id: currentSeatId,
    new_seat_id: requestedSeatId,
    reason: "Seat reassigned by admin",
  });

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}

export async function createExpenseAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  
  const amount = getNumber(formData, "amount", 0);
  const category = getString(formData, "category");
  const description = getOptionalString(formData, "description");
  const date = getString(formData, "date") || new Date().toISOString().split("T")[0];

  if (amount <= 0 || !category) {
    return { error: "Please provide a valid amount and category." };
  }

  const { error } = await supabase.from("expenses").insert({
    amount,
    category,
    description,
    date,
    recorded_by_profile_id: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
  return { success: true };
}

export async function updateExpenseAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  
  const id = getString(formData, "id");
  const amount = getNumber(formData, "amount", 0);
  const category = getString(formData, "category");
  const description = getOptionalString(formData, "description");
  const date = getString(formData, "date");

  if (!id || amount <= 0 || !category) {
    return { error: "Invalid data." };
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      amount,
      category,
      description,
      date,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
  return { success: true };
}

export async function deleteExpenseAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  
  const id = getString(formData, "id");
  if (!id) return;

  await supabase.from("expenses").delete().eq("id", id);

  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
}

