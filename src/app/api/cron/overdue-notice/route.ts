import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const settings = await getHubSettings();

  const todayStr = new Date().toISOString().slice(0, 10);

  const processedKeys = new Set<string>();
  const { data: existingReminders } = await supabase
    .from("notifications")
    .select("metadata")
    .eq("category", "billing")
    .gte("created_at", `${todayStr}T00:00:00.000Z`);

  for (const row of existingReminders ?? []) {
    const key = ((row.metadata as { reminder_key?: string } | null)?.reminder_key ?? "").trim();
    if (key) processedKeys.add(key);
  }

  // Find bills that are due before today and not fully paid
  const { data: overdueBills } = await supabase
    .from("bills")
    .select("id, amount_due, amount_paid, due_date, readers!inner(id, name, email)")
    .lt("due_date", todayStr)
    .in("status", ["pending", "partial", "rejected_proof"]);

  const { data: dueTodayBills } = await supabase
    .from("bills")
    .select("id, amount_due, amount_paid, due_date, readers!inner(id, name, email)")
    .eq("due_date", todayStr)
    .in("status", ["pending", "partial", "rejected_proof"]);

  const { data: rejectedProofBills } = await supabase
    .from("bills")
    .select("id, amount_due, amount_paid, readers!inner(id, name, email)")
    .eq("status", "rejected_proof");

  let noticesSent = 0;
  type BillReader = { id: string; name: string; email?: string | null };

  const sendBillReminder = async (options: {
    billId: string;
    readerId: string;
    readerName: string;
    readerEmail: string | null;
    amountDue: number;
    dueDate: string | null;
    reminderType: "overdue" | "due_today" | "rejected_proof";
    title: string;
    body: string;
  }) => {
    const key = `${options.reminderType}:${options.billId}:${todayStr}`;
    if (processedKeys.has(key)) return;
    processedKeys.add(key);

    await createNotification({
      audienceType: "reader",
      audienceId: options.readerId,
      category: "billing",
      title: options.title,
      body: options.body,
      link: "/student/payments",
      metadata: {
        reminder_key: key,
        reminder_type: options.reminderType,
        bill_id: options.billId,
        run_date: todayStr,
      },
    });

    if (options.readerEmail) {
      const emailTemplate = emailTemplates.overdueNotice({
        name: options.readerName,
        invoiceId: options.billId,
        amountDue: options.amountDue,
        lastDate: options.dueDate || todayStr,
        qrUrl: settings.static_upi_qr_url,
        upiId: settings.static_upi_id,
      });
      await sendEmail({
        to: [options.readerEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      noticesSent += 1;
    }
  };

  for (const bill of overdueBills ?? []) {
    const student = Array.isArray(bill.readers)
      ? (bill.readers[0] as BillReader | undefined)
      : (bill.readers as BillReader | null);
    if (!student) continue;
    const remainingAmount = Number(bill.amount_due) - Number(bill.amount_paid);
    await sendBillReminder({
      billId: bill.id,
      readerId: student.id,
      readerName: student.name,
      readerEmail: student.email ?? null,
      amountDue: remainingAmount,
      dueDate: bill.due_date,
      reminderType: "overdue",
      title: "Payment overdue",
      body: `Your payment of Rs ${remainingAmount} is overdue. Please settle your dues immediately to avoid late fees.`,
    });
  }

  for (const bill of dueTodayBills ?? []) {
    const student = Array.isArray(bill.readers)
      ? (bill.readers[0] as BillReader | undefined)
      : (bill.readers as BillReader | null);
    if (!student) continue;
    const remainingAmount = Number(bill.amount_due) - Number(bill.amount_paid);
    await sendBillReminder({
      billId: bill.id,
      readerId: student.id,
      readerName: student.name,
      readerEmail: student.email ?? null,
      amountDue: remainingAmount,
      dueDate: bill.due_date,
      reminderType: "due_today",
      title: "Payment due today",
      body: `Your payment of Rs ${remainingAmount} is due today. Please pay and upload the screenshot.`,
    });
  }

  for (const bill of rejectedProofBills ?? []) {
    const student = Array.isArray(bill.readers)
      ? (bill.readers[0] as BillReader | undefined)
      : (bill.readers as BillReader | null);
    if (!student) continue;
    const remainingAmount = Number(bill.amount_due) - Number(bill.amount_paid);
    await sendBillReminder({
      billId: bill.id,
      readerId: student.id,
      readerName: student.name,
      readerEmail: student.email ?? null,
      amountDue: remainingAmount,
      dueDate: null,
      reminderType: "rejected_proof",
      title: "Payment proof rejected",
      body: `Your payment proof was rejected for invoice ${bill.id}. Re-upload proof for Rs ${remainingAmount}.`,
    });
  }

  return NextResponse.json({ success: true, noticesSent });
}
