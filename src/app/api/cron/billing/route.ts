import { NextResponse } from "next/server";

import { calculateInvoiceAmount, getCurrentBillingPeriod, type PlanType } from "@/lib/billing-utils";
import { createNotification } from "@/lib/notifications";
import { sendEmailBatch } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { getISTDate, getISTDateString, getISTMonday } from "@/lib/date-utils";

function normalizePlanType(value: string): PlanType {
  if (value === "daily" || value === "weekly" || value === "monthly") return value;
  return "monthly";
}

function planDefaultPrice(planType: PlanType, settings: { daily_price: number; weekly_price: number; default_monthly_price: number }) {
  if (planType === "daily") return Number(settings.daily_price) || 150;
  if (planType === "weekly") return Number(settings.weekly_price) || 650;
  return Number(settings.default_monthly_price) || 1650;
}

function formatPlanLabel(planType: PlanType) {
  if (planType === "daily") return "Daily";
  if (planType === "weekly") return "Weekly";
  return "Monthly";
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const settings = await getHubSettings();
  const { month, year } = getCurrentBillingPeriod();
  const today = getISTDate();
  const todayDate = getISTDateString(today);
  const weekStartDate = getISTDateString(getISTMonday(today));

  const { data: students } = await supabase
    .from("readers")
    .select("id, name, email, monthly_fee, reader_type")
    .eq("status", "active");

  let createdCount = 0;
  const emailPayloads: any[] = [];

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

    await createNotification({
      audienceType: "reader",
      audienceId: student.id,
      category: "billing",
      title: `${formatPlanLabel(planType)} payment due`,
      body: `Your ${formatPlanLabel(planType).toLowerCase()} fee of Rs ${invoice.totalAmount} is due. Please pay using the static UPI QR and upload the screenshot.`,
      link: "/student",
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
      
      emailPayloads.push({
        to: [student.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    }

    createdCount += 1;
  }

  // Send all emails in one single batch request
  if (emailPayloads.length > 0) {
    await sendEmailBatch(emailPayloads);
  }

  return NextResponse.json({ success: true, createdCount });
}
