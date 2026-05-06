"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { notifyProfileIds, notifyReader } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { getISTDate, getISTDateString, getISTTimestamp } from "@/lib/date-utils";
import { getCurrentBillingPeriod, normalizeRole, type AppRole } from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  getNumber,
  getFile,
  getIsoDateOnly,
  getMondayOfCurrentWeek,
  normalizePlanType,
  planDefaultPrice,
  formatPlanLabel,
  type PaymentProofActionState,
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

function resolveBillStatusForManualEdit(amountDue: number, amountPaid: number) {
  if (amountPaid >= amountDue && amountDue > 0) return "paid";
  if (amountPaid > 0 && amountPaid < amountDue) return "partial";
  return "pending";
}

async function syncStudentStatusWithBills(supabase: any, readerId: string) {
  const { data: reader } = await supabase.from("readers").select("status, onboarding_completed").eq("id", readerId).maybeSingle();
  if (!reader || reader.status !== "pending_payment") return;

  const { data: otherDues } = await supabase.from("bills")
    .select("id")
    .eq("reader_id", readerId)
    .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
    .limit(1);

  if (!otherDues || otherDues.length === 0) {
    await supabase.from("readers").update({
      registration_paid: true,
      caution_paid: true,
      status: reader.onboarding_completed ? "active" : "pending_onboarding",
    }).eq("id", readerId);
  }
}

export async function submitPaymentProof(
  _prevState: PaymentProofActionState,
  formData: FormData,
): Promise<PaymentProofActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return { status: "error", message: "Your session expired. Please sign in again.", billId: null };

  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const amount = getNumber(formData, "amount", 0);
  const proofFile = getFile(formData, "payment_proof");

  if (!billId || amount <= 0 || !proofFile) {
    return { status: "error", message: "Add the payment amount and attach a screenshot before submitting.", billId };
  }

  const { data: bill } = await supabase.from("bills").select("id, reader_id, status").eq("id", billId).eq("reader_id", student.id).maybeSingle();
  if (!bill) return { status: "error", message: "That invoice could not be found.", billId };
  if (bill.status === "paid") return { status: "error", message: "This invoice is already marked as paid.", billId };

  const { data: existingPending } = await supabase
    .from("transactions")
    .select("id")
    .eq("bill_id", billId)
    .eq("reader_id", student.id)
    .eq("verification_status", "pending")
    .limit(1)
    .maybeSingle();

  if (existingPending || bill.status === "proof_submitted") {
    return { status: "error", message: "A payment proof is already awaiting verification for this invoice.", billId };
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (proofFile.size > MAX_FILE_SIZE) return { status: "error", message: "Payment proof file is too large.", billId };
  if (!proofFile.type.startsWith("image/")) return { status: "error", message: "Invalid file type. Please upload an image.", billId };

  let uploadedProof: { secureUrl: string; publicId: string } | null = null;

  try {
    uploadedProof = await uploadToCloudinary(proofFile, "bodhi-payment-proofs");

    const { error: transactionError } = await supabase.from("transactions").insert({
      reader_id: student.id,
      bill_id: billId,
      type: "upi",
      amount,
      payment_mode: "upi",
      payment_proof_url: uploadedProof.secureUrl,
      payment_proof_public_id: uploadedProof.publicId,
      verification_status: "pending",
      submitted_at: getISTTimestamp(),
    });

    if (transactionError) throw new Error(transactionError.message);

    const { error: billError } = await supabase.from("bills").update({ status: "proof_submitted" }).eq("id", billId).eq("reader_id", student.id);
    if (billError) throw new Error(billError.message);

    const sideEffects = [];
    
    getStaffAndAdminProfileIds().then(profileIds => {
      notifyProfileIds(profileIds, {
        category: "payment",
        title: "New payment proof submitted",
        body: `${student.name} uploaded a payment screenshot for verification.`,
        link: "/staff/billing",
      }).catch(e => console.error(e));
    });

    getHubSettings().then(settings => {
      if (settings.billing_notification_emails.length > 0) {
        const template = emailTemplates.paymentProofSubmitted({
          studentName: student.name,
          amount,
          invoiceId: billId,
          dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/staff/billing`,
        });
        sendEmail({
          to: settings.billing_notification_emails,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }).catch(e => console.error(e));
      }
    });

    revalidatePath("/student");
    revalidatePath("/student/payments");
    revalidatePath("/super-admin/billing");
    revalidatePath(`/super-admin/billing/${billId}`);
    revalidatePath("/staff/billing");

    return { status: "success", message: "Payment proof uploaded successfully. Staff verification is pending.", billId };
  } catch (error) {
    if (uploadedProof?.publicId) await deleteFromCloudinary(uploadedProof.publicId).catch(() => null);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return { status: "error", message: `Upload failed: ${message}. Re-select the screenshot and try again.`, billId };
  }
}

export async function verifyPaymentProof(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");
  const notes = getOptionalString(formData, "notes");

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*, bills(id, invoice_kind, amount_due), readers(id, name, onboarding_completed, email)")
    .eq("id", transactionId)
    .maybeSingle();

  if (!transaction) return;

  await supabase.from("transactions").update({
    verification_status: "verified",
    verification_notes: notes,
    verified_by_profile_id: profile.id,
    verified_at: getISTTimestamp(),
  }).eq("id", transactionId);

  const sideEffects = [];

  if (transaction.payment_proof_public_id) {
    sideEffects.push(deleteFromCloudinary(transaction.payment_proof_public_id).catch(e => console.error(e)));
    sideEffects.push(supabase.from("transactions").update({
      payment_proof_url: null,
      payment_proof_public_id: null,
    }).eq("id", transactionId));
  }

  const { data: updatedBill } = await supabase.from("bills").select("status").eq("id", transaction.bill_id).single();
  if (updatedBill?.status === "paid") {
    sideEffects.push(syncStudentStatusWithBills(supabase, transaction.reader_id));
  }

  sideEffects.push(notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Payment verified",
    body: "Your payment has been marked as paid.",
    link: "/student/payments",
  }));

  if (transaction.readers?.email) {
    const emailTemplate = emailTemplates.paymentVerified({
      name: transaction.readers.name ?? "Student",
      invoiceId: transaction.bill_id,
      amountApplied: transaction.amount,
    });
    sideEffects.push(sendEmail({
      to: [transaction.readers.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }).catch(e => console.error(e)));
  }

  await Promise.allSettled(sideEffects);

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${transaction.bill_id ?? transactionId}`);
  revalidatePath("/staff/billing");
}

export async function rejectPaymentProof(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");
  const notes = getString(formData, "notes") || "Payment proof was rejected. Please upload a clearer screenshot.";

  const { data: transaction } = await supabase.from("transactions").select("reader_id,bill_id").eq("id", transactionId).maybeSingle();
  if (!transaction) return;

  await supabase.from("transactions").update({
    verification_status: "rejected",
    verification_notes: notes,
    verified_by_profile_id: profile.id,
    verified_at: getISTTimestamp(),
  }).eq("id", transactionId);

  const sideEffects = [];

  sideEffects.push(notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Payment proof rejected",
    body: notes,
    link: "/student/payments",
  }));

  const { data: reader } = await supabase.from("readers").select("name, email").eq("id", transaction.reader_id).maybeSingle();

  if (reader?.email) {
    const emailTemplate = emailTemplates.paymentRejected({
      name: reader.name ?? "Student",
      invoiceId: transaction.bill_id,
      reason: notes,
      reuploadLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/payments?invoiceId=${transaction.bill_id}`,
    });
    sideEffects.push(sendEmail({
      to: [reader.email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }));
  }

  await Promise.allSettled(sideEffects);

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${transactionId}`);
  revalidatePath("/staff/billing");
}

export async function closeRejectedPaymentProof(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const transactionId = getString(formData, "transaction_id");

  const { data: transaction } = await supabase.from("transactions").select("reader_id, payment_proof_public_id").eq("id", transactionId).maybeSingle();
  if (!transaction) return;

  const sideEffects = [];

  if (transaction.payment_proof_public_id) {
    sideEffects.push(deleteFromCloudinary(transaction.payment_proof_public_id).catch(e => console.error(e)));
  }

  await supabase.from("transactions").update({
    verification_status: "closed",
    payment_proof_url: null,
    payment_proof_public_id: null,
    updated_at: getISTTimestamp(),
  }).eq("id", transactionId);

  sideEffects.push(notifyReader(transaction.reader_id, {
    category: "payment",
    title: "Rejected proof closed",
    body: "The rejected proof has been closed. Upload a new screenshot if payment has been made.",
    link: "/student/payments",
  }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/student");
  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
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

  const { data: bill } = await supabase.from("bills").select("id, amount_paid, amount_due, status").eq("id", billId).maybeSingle();
  if (!bill) return;

  const computedAmountDue = amountDueInput && Number.isFinite(Number(amountDueInput))
      ? Number(amountDueInput)
      : Math.max(0, baseAmount) + Math.max(0, registrationAmount) + Math.max(0, cautionAmount);
      
  const nextStatus = adminStatus && ["pending", "proof_submitted", "partial", "paid", "rejected_proof", "overdue"].includes(adminStatus)
      ? adminStatus
      : resolveBillStatusForManualEdit(computedAmountDue, Number(bill.amount_paid) || 0);

  await supabase.from("bills").update({
    due_date: dueDate || null,
    base_amount: Math.max(0, baseAmount),
    registration_amount: Math.max(0, registrationAmount),
    caution_amount: Math.max(0, cautionAmount),
    amount_due: Math.max(0, computedAmountDue),
    status: nextStatus,
  }).eq("id", billId);

  const { data: billInfo } = await supabase.from("bills").select("reader_id, invoice_kind").eq("id", billId).single();

  if (nextStatus === "paid") {
    await syncStudentStatusWithBills(supabase, billInfo.reader_id);
  }

  await supabase.from("bill_audit_logs").insert({
    bill_id: billId,
    actor_profile_id: profile.id,
    action: "bill_edit",
    notes: note || "Manual invoice edit",
    before_state: { amount_due: bill.amount_due, status: bill.status },
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

  const { data: bill } = await supabase.from("bills").select("id, reader_id, invoice_kind").eq("id", billId).maybeSingle();
  if (!bill) return;

  await supabase.from("transactions").insert({
    reader_id: bill.reader_id,
    bill_id: bill.id,
    type: "offline",
    amount,
    payment_mode: normalizedMode,
    verification_status: "verified",
    verification_notes: note || `Offline payment received (${normalizedMode})`,
    submitted_at: getISTTimestamp(),
    verified_at: getISTTimestamp(),
    verified_by_profile_id: profile.id,
  });
  
  const { data: updatedBill } = await supabase.from("bills").select("status").eq("id", billId).single();
  if (updatedBill?.status === "paid") {
    sideEffects.push(syncStudentStatusWithBills(supabase, bill.reader_id));
  }

  const sideEffects = [];

  sideEffects.push(supabase.from("bill_audit_logs").insert({
    bill_id: bill.id,
    actor_profile_id: profile.id,
    action: "offline_payment_received",
    notes: note || `Amount ${amount} via ${normalizedMode}`,
    before_state: {},
    after_state: { amount, payment_mode: normalizedMode },
  }));

  sideEffects.push(notifyReader(bill.reader_id, {
    category: "payment",
    title: "Offline payment recorded",
    body: `An offline payment of Rs ${amount} has been recorded to your invoice.`,
    link: "/student/payments",
  }));

  await Promise.allSettled(sideEffects);

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

  const { data: bill } = await supabase.from("bills").select("id, reader_id, amount_due, amount_paid, status").eq("id", billId).maybeSingle();
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
    submitted_at: getISTTimestamp(),
    verified_at: getISTTimestamp(),
    verified_by_profile_id: profile.id,
  });

  await supabase.from("bills").update({ amount_paid: nextPaid, status: nextStatus }).eq("id", bill.id);

  if (nextStatus === "paid") {
    await syncStudentStatusWithBills(supabase, bill.reader_id);
  }

  const sideEffects = [];

  sideEffects.push(supabase.from("bill_audit_logs").insert({
    bill_id: bill.id,
    actor_profile_id: profile.id,
    action: entryType,
    notes: note || null,
    before_state: { amount_paid: bill.amount_paid, status: bill.status },
    after_state: { amount_paid: nextPaid, status: nextStatus, delta },
  }));

  sideEffects.push(notifyReader(bill.reader_id, {
    category: "billing",
    title: entryType === "refund" ? "Refund processed" : "Billing adjustment posted",
    body: entryType === "refund" ? `A refund entry of Rs ${amount} was posted to your billing ledger.` : `A manual adjustment of Rs ${amount} was posted to your billing ledger.`,
    link: "/student/payments",
  }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${bill.id}`);
  revalidatePath("/student/payments");
}

export async function removeBillTransactionAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin"]);
  const supabase = createAdminClient();
  const billId = getString(formData, "bill_id");
  const transactionId = getString(formData, "transaction_id");
  
  if (!billId || !transactionId) return;

  const { data: transaction } = await supabase.from("transactions").select("id, bill_id, amount, type, verification_status, verification_notes").eq("id", transactionId).eq("bill_id", billId).maybeSingle();
  if (!transaction) return;
  if (!["verified", "closed"].includes(transaction.verification_status)) return;

  const { data: bill } = await supabase.from("bills").select("id, amount_due, amount_paid").eq("id", billId).maybeSingle();
  if (!bill) return;

  const nextPaid = Math.max(0, Number(bill.amount_paid || 0) - Number(transaction.amount || 0));
  const nextStatus = resolveBillStatusForManualEdit(Number(bill.amount_due || 0), nextPaid);

  await supabase.from("transactions").delete().eq("id", transactionId);
  await supabase.from("bills").update({ amount_paid: nextPaid, status: nextStatus }).eq("id", billId);

  await supabase.from("bill_audit_logs").insert({
    bill_id: billId,
    actor_profile_id: profile.id,
    action: "ledger_entry_removed",
    notes: `Removed ${transaction.type} entry of Rs ${Math.abs(Number(transaction.amount || 0))}. ${transaction.verification_notes || ""}`.trim(),
    before_state: { amount_paid: Number(bill.amount_paid || 0), status: null, transaction_id: transactionId },
    after_state: { amount_paid: nextPaid, status: nextStatus },
  });

  revalidatePath("/super-admin/billing");
  revalidatePath(`/super-admin/billing/${billId}`);
  revalidatePath("/staff/billing");
  revalidatePath("/student/payments");
}

export async function generateMonthlyInvoices() {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const settings = await getHubSettings();
  const { month, year } = getCurrentBillingPeriod();
  const today = getISTDate();
  const todayDate = getISTDateString(today);
  const weekStartDate = getIsoDateOnly(getMondayOfCurrentWeek(today));

  const { data: students } = await supabase.from("readers").select("id, name, email, monthly_fee, reader_type").in("status", ["active", "pending_onboarding"]);

  const ops = (students ?? []).map(async (student) => {
    const planType = normalizePlanType(student.reader_type ?? "monthly");
    const planFee = Math.max(0, Number(student.monthly_fee) || planDefaultPrice(planType, settings));
    
    const dueDate = planType === "daily" ? todayDate : planType === "weekly" ? weekStartDate : new Date(Date.UTC(year, month - 1, 5)).toISOString().slice(0, 10);
    const recurringTitle = planType === "daily" ? `Daily fee for ${dueDate}` : planType === "weekly" ? `Weekly fee for week of ${dueDate}` : `Monthly fee for ${new Date(Date.UTC(year, month - 1, 5)).toLocaleString("en-IN", { month: "long", timeZone: "UTC" })}`;
    const invoiceKind = planType === "monthly" ? "monthly_renewal" : "manual";

    let existingBillQuery = supabase.from("bills").select("id").eq("reader_id", student.id).eq("due_date", dueDate).eq("title", recurringTitle);
    if (planType === "monthly") {
      existingBillQuery = supabase.from("bills").select("id").eq("reader_id", student.id).eq("month", month).eq("year", year).eq("invoice_kind", "monthly_renewal");
    }
    
    const { data: existingBill } = await existingBillQuery.maybeSingle();
    if (existingBill) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { calculateInvoiceAmount } = require("@/lib/billing-utils");
    const invoice = calculateInvoiceAmount({ planType, monthlyFee: planFee, includeAdmissionFees: false });

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

    const sideEffects = [];

    sideEffects.push(notifyReader(student.id, {
      category: "billing",
      title: `${formatPlanLabel(planType)} payment due`,
      body: `Your ${formatPlanLabel(planType).toLowerCase()} fee of Rs ${invoice.totalAmount} is due. Please pay using the static UPI QR and upload the screenshot.`,
      link: "/student/payments",
    }));

    if (student.email) {
      const monthLabel = planType === "daily" ? `Daily cycle ${dueDate}` : planType === "weekly" ? `Week of ${dueDate}` : new Date(Date.UTC(year, month - 1, 5)).toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
      const emailTemplate = emailTemplates.monthlyDue({
        name: student.name,
        amount: invoice.totalAmount,
        monthLabel,
        qrUrl: settings.static_upi_qr_url,
        upiId: settings.static_upi_id,
      });
      sideEffects.push(sendEmail({
        to: [student.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }));
    }
    
    await Promise.allSettled(sideEffects);
  });

  await Promise.all(ops);

  revalidatePath("/super-admin/billing");
  revalidatePath("/staff/billing");
  revalidatePath("/student");
}
