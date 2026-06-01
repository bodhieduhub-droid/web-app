"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmail, sendEmailBatched } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createNotification, notifyReader } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { getISTDate, getISTTimestamp } from "@/lib/date-utils";
import {
  calculateInvoiceAmount,
  calculateMonthlyAdmissionAmount,
  normalizeRole,
  type AppRole,
  type ExamCategory,
} from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  getNumber,
  getFile,
  normalizePlanType,
  planDefaultPrice,
  getIsoDateOnly,
  formatPlanLabel,
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
  const joinDate = joinDateValue ? new Date(joinDateValue) : getISTDate();

  if (!enquiryId || !seatId || !email) {
    await notifyActor(profile.id, "Conversion failed", "Enquiry, seat, and email are required to convert a student.");
    return;
  }

  const { data: enquiry } = await supabase.from("enquiries").select("*").eq("id", enquiryId).maybeSingle();

  if (!enquiry) {
    await notifyActor(profile.id, "Conversion failed", "Enquiry record was not found.");
    return;
  }

  const allowedEnquiryStatuses = new Set(["new", "contacted", "seat_blocked"]);
  if (!allowedEnquiryStatuses.has(enquiry.status)) {
    await notifyActor(profile.id, "Conversion blocked", `Enquiry status '${enquiry.status}' cannot be converted.`);
    return;
  }

  const { data: seat } = await supabase
    .from("seats")
    .select("id, status, seat_number, linked_enquiry_id")
    .eq("id", seatId)
    .maybeSingle();

  const canUseSeat = !!seat && (seat.status === "available" || (seat.status === "blocked" && seat.linked_enquiry_id === enquiryId));

  if (!canUseSeat) {
    await notifyActor(profile.id, "Conversion blocked", "Selected seat is no longer available. Pick another available seat and retry.");
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
      credentials_sent_at: getISTTimestamp(),
      join_date: joinDate.toISOString(),
    })
    .select("id")
    .single();

  if (studentError || !student) {
    await notifyActor(profile.id, "Conversion failed", studentError?.message || "Reader profile creation failed.");
    return;
  }

  // Optimize: Batch seat and enquiry updates if possible, but sequential is fine for now as they are independent tables.
  await Promise.all([
    supabase.from("seats").update({
      status: "occupied",
      assigned_reader_id: student.id,
      linked_enquiry_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
    }).eq("id", seatId),
    
    supabase.from("seats").update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    }).eq("linked_enquiry_id", enquiryId).eq("status", "blocked").neq("id", seatId),
    
    supabase.from("enquiries").update({
      status: "converted",
      converted_reader_id: student.id,
      converted_at: getISTTimestamp(),
      assigned_to: profile.id,
    }).eq("id", enquiryId)
  ]);

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

  // Optimized background side-effects
  const sideEffects = [];

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
    sideEffects.push(sendEmail({
      to: [email],
      subject: admissionEmail.subject,
      html: admissionEmail.html,
      text: admissionEmail.text,
    }));
  }

  if (createPortalLogin) {
    const credentialEmail = emailTemplates.credentials({
      name: enquiry.name,
      email,
      password,
    });
    sideEffects.push(sendEmail({
      to: [email],
      subject: credentialEmail.subject,
      html: credentialEmail.html,
      text: credentialEmail.text,
    }));
    sideEffects.push(notifyReader(student.id, {
      category: "account",
      title: "Your account is ready",
      body: "Login with the credentials sent to your email and complete onboarding.",
      link: "/student/onboarding",
    }));
  }

  if (settings.billing_notification_emails.length > 0) {
    sideEffects.push(sendEmail({
      to: settings.billing_notification_emails,
      subject: `Student converted: ${enquiry.name}`,
      html: `<p>${enquiry.name} was converted to a ${planType} student and assigned a seat. Portal access: ${createPortalLogin ? "yes" : "no"}.</p>`,
    }));
  }

  // Don't await side effects to return to user faster, unless Next.js requires it to finish before response.
  // Using Promise.all speeds it up significantly.
  await Promise.allSettled(sideEffects);

  revalidatePath("/super-admin/enquiries");
  revalidatePath("/super-admin/students");
  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/enquiries");
  revalidatePath("/staff/students");
  revalidatePath("/staff/seats");
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
  const joinDate = joinDateValue ? new Date(joinDateValue) : getISTDate();
  const biometricId = getOptionalString(formData, "biometric_id");

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

  let idProofUrl = null;
  let idProofPublicId = null;

  if (!isQuickEntry && idProofFile) {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (idProofFile.size > MAX_FILE_SIZE) {
      await notifyActor(profile.id, "Onboarding failed", "ID proof file is too large. Max 10MB allowed.");
      return;
    }

    if (!idProofFile.type.startsWith("image/")) {
      await notifyActor(profile.id, "Onboarding failed", "Invalid file type. We only allow image files (JPG, PNG, WebP) for ID proof. PDFs are not allowed.");
      return;
    }

    try {
      const uploaded = await uploadToCloudinary(idProofFile, "bodhi-id-proofs");
      idProofUrl = uploaded.secureUrl;
      idProofPublicId = uploaded.publicId;
    } catch (err) {
      console.error("[onboardStudentAction] ID upload failed:", err);
      await notifyActor(profile.id, "Onboarding failed", "There was an error uploading the ID proof. Please try again with a different image.");
      return;
    }
  }

  const { data: seat } = await supabase.from("seats").select("id, status, seat_number").eq("id", seatId).maybeSingle();

  if (!seat) {
    await notifyActor(profile.id, "Onboarding failed", "Selected seat does not exist.");
    return;
  }

  if (readerType === "monthly" && seat.status !== "available") {
    await notifyActor(profile.id, "Onboarding failed", "Monthly students require an available seat.");
    return;
  }

  const password = `Bodhi${randomBytes(4).toString("hex")}!`;
  let userId: string | null = null;

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
      onboarding_completed: isQuickEntry || !!idProofUrl,
      join_date: joinDate.toISOString(),
      address,
      purpose,
      preparing_for_exam: preparingForExam,
      exam_details: examDetails,
      id_proof_url: idProofUrl,
      id_proof_public_id: idProofPublicId,
      biometric_id: biometricId,
      credentials_sent_at: email ? getISTTimestamp() : null,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    await notifyActor(profile.id, "Onboarding failed", studentError?.message || "Reader profile creation failed.");
    return;
  }

  if (seat.status === "available") {
    await supabase.from("seats").update({
      status: "occupied",
      assigned_reader_id: student.id,
      linked_enquiry_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
    }).eq("id", seatId);
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

  const sideEffects = [];

  if (email) {
    const credentialEmail = emailTemplates.credentials({ name, email, password });
    sideEffects.push(sendEmail({
      to: [email],
      subject: credentialEmail.subject,
      html: credentialEmail.html,
      text: credentialEmail.text,
    }));

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
      sideEffects.push(sendEmail({
        to: [email],
        subject: admissionEmail.subject,
        html: admissionEmail.html,
        text: admissionEmail.text,
      }));
    }
  }

  try {
    await Promise.allSettled(sideEffects);

    revalidatePath("/super-admin/students");
    revalidatePath("/staff/students");
    revalidatePath("/super-admin/seats");
    revalidatePath("/staff/seats");
    
    const role = normalizeRole(profile.role);
    redirect(role === "super_admin" ? "/super-admin/students" : "/staff/students");
  } catch (err: any) {
    if (err && typeof err === 'object' && err.digest && err.digest.startsWith('NEXT_REDIRECT')) throw err;
    console.error("[onboardStudentAction] Finalization failed:", err);
    await notifyActor(profile.id, "Onboarding error", `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}


export async function verifyStudentIdProofAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");

  if (!readerId) return;

  const { error } = await supabase.from("readers").update({ id_proof_verified: true }).eq("id", readerId);
  
  if (error) {
    await notifyActor(profile.id, "Verification Failed", error.message);
    return;
  }

  await notifyActor(profile.id, "ID Proof Verified", `ID proof has been verified.`);

  revalidatePath("/super-admin/students");
  revalidatePath(`/super-admin/students/${readerId}`);
  revalidatePath("/staff/students");
}

export async function deleteEnquiryAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const enquiryId = getString(formData, "enquiry_id");
  const shouldRedirect = getString(formData, "redirect") === "yes";

  if (!enquiryId) {
    await notifyActor(profile.id, "Delete failed", "Enquiry ID is required.");
    return;
  }

  const { data: seat } = await supabase.from("seats").select("id").eq("linked_enquiry_id", enquiryId).maybeSingle();

  if (seat) {
    await supabase.from("seats").update({
      status: "available",
      linked_enquiry_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      blocked_until: null,
    }).eq("id", seat.id);
  }

  const { error } = await supabase.from("enquiries").delete().eq("id", enquiryId);

  if (error) {
    await notifyActor(profile.id, "Delete failed", error.message);
  } else {
    revalidatePath("/staff/enquiries");
    revalidatePath("/super-admin/enquiries");
    if (shouldRedirect) redirect("/super-admin/enquiries");
  }
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

  const { data: enquiry } = await supabase.from("enquiries").select("id, status").eq("id", enquiryId).maybeSingle();
  if (!enquiry) return;

  if (enquiry.status === "converted" && !["converted", "closed"].includes(status)) {
    await notifyActor(profile.id, "Enquiry update blocked", "Converted enquiries can only stay converted or be closed.");
    return;
  }

  await supabase.from("enquiries").update({
    status,
    notes,
    assigned_to: assignedTo,
    updated_at: getISTTimestamp(),
  }).eq("id", enquiryId);

  revalidatePath("/super-admin/enquiries");
  revalidatePath("/staff/enquiries");
}

export async function submitOnboarding(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const { student } = await requireRole(["student"]);
    if (!student) return { error: "Session expired. Please sign in again." };

    const supabase = createAdminClient();
    const address = getString(formData, "address");
    const purpose = getString(formData, "purpose");
    const preparingForExam = getString(formData, "preparing_for_exam") === "yes";
    const examDetails = getOptionalString(formData, "exam_details");
    const categories = formData.getAll("exam_categories").map((e) => (typeof e === "string" ? e : "")).filter(Boolean) as ExamCategory[];
    const idProof = getFile(formData, "id_proof");

    if (!address || !purpose || !idProof) return { error: "Please fill all required fields and upload an ID proof." };

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (idProof.size > MAX_FILE_SIZE) return { error: "ID proof file is too large. Please upload an image under 10MB." };
    if (!idProof.type || !idProof.type.startsWith("image/")) return { error: "Invalid file type. We only allow image files (JPG, PNG, WebP) for ID proof. PDFs are not allowed." };

    const uploadedId = await uploadToCloudinary(idProof, "bodhi-id-proofs");

    const { count: pendingBills } = await supabase
      .from("bills")
      .select("*", { count: "exact", head: true })
      .eq("reader_id", student.id)
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]);

    const { error: updateError } = await supabase.from("readers").update({
      address,
      purpose,
      preparing_for_exam: preparingForExam,
      exam_details: examDetails,
      onboarding_completed: true,
      onboarding_completed_at: getISTTimestamp(),
      id_proof_url: uploadedId.secureUrl,
      id_proof_public_id: uploadedId.publicId,
      status: (pendingBills ?? 0) > 0 ? "pending_payment" : "active",
    }).eq("id", student.id);

    if (updateError) return { error: `Database error: ${updateError.message}` };

    await supabase.from("student_exam_interests").delete().eq("reader_id", student.id);
    if (categories.length > 0) {
      await supabase.from("student_exam_interests").insert(categories.map((category) => ({ reader_id: student.id, category })));
    }

    revalidatePath("/student");
  } catch (err: any) {
    if (err && typeof err === 'object' && err.digest && err.digest.startsWith('NEXT_REDIRECT')) throw err;
    return { error: `Submission failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.` };
  }
  redirect("/student");
}

export async function updateExamInterestsAction(formData: FormData) {
  const { student } = await requireRole(["student"]);
  if (!student) return;

  const supabase = createAdminClient();
  const preparingForExam = getString(formData, "preparing_for_exam") === "yes";
  const categories = formData.getAll("exam_categories").map((e) => (typeof e === "string" ? e : "")).filter(Boolean) as ExamCategory[];

  await supabase.from("readers").update({ preparing_for_exam: preparingForExam }).eq("id", student.id);

  await supabase.from("student_exam_interests").delete().eq("reader_id", student.id);
  if (categories.length > 0) {
    await supabase.from("student_exam_interests").insert(categories.map((category) => ({ reader_id: student.id, category })));
  }

  revalidatePath("/student");
}
