import "server-only";

type EmailContent = {
  subject: string;
  html: string;
  text?: string;
};

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const brand = "Bodhi Edu Hub";

function renderEmail(options: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background: #f5f7f9; padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; padding: 32px; color: #1f2a37;">
            <tr>
              <td style="font-size: 20px; font-weight: 700; padding-bottom: 8px;">${brand}</td>
            </tr>
            <tr>
              <td style="font-size: 18px; font-weight: 600; padding: 4px 0 12px 0;">${options.title}</td>
            </tr>
            <tr>
              <td style="font-size: 15px; line-height: 1.6; color: #374151;">${options.body}</td>
            </tr>
            ${
              options.ctaLabel && options.ctaUrl
                ? `<tr><td style="padding: 20px 0;"><a href="${options.ctaUrl}" style="display:inline-block; background:#0f172a; color:#ffffff; padding:12px 18px; border-radius:8px; text-decoration:none; font-weight:600;">${options.ctaLabel}</a></td></tr>`
                : ""
            }
            <tr>
              <td style="font-size: 12px; color: #6b7280; padding-top: 24px;">${
                options.footerNote || "You are receiving this because you have an account or enquiry with Bodhi Edu Hub."
              }</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export const emailTemplates = {
  enquiryToTeam(payload: { name: string; phone: string; email?: string | null }): EmailContent {
    const subject = `New enquiry from ${payload.name}`;
    const body = `
      <p>A new public enquiry was submitted.</p>
      <p><strong>Name:</strong> ${payload.name}<br/>
      <strong>Phone:</strong> ${payload.phone}<br/>
      <strong>Email:</strong> ${payload.email || "Not provided"}</p>
    `;
    return { subject, html: renderEmail({ title: "New enquiry received", body }) };
  },

  enquiryAcknowledgement(payload: { name: string }): EmailContent {
    const subject = "We received your enquiry";
    const body = `<p>Hi ${payload.name},</p><p>Thanks for reaching out. Our team will contact you shortly about Reading Hub seats and pricing.</p>`;
    return { subject, html: renderEmail({ title: "Thanks for your enquiry", body }) };
  },

  seatAvailable(payload: { name: string; seatLabel?: string }): EmailContent {
    const subject = "Seat available – complete admission";
    const body = `<p>Hi ${payload.name},</p><p>A seat is available for you${payload.seatLabel ? ` (Seat ${payload.seatLabel})` : ""}. Please complete admission by paying the registration (₹400), caution (₹300), and first month's fee.</p>`;
    return { subject, html: renderEmail({ title: "Seat available", body }) };
  },

  admissionInvoice(payload: {
    name: string;
    invoiceId: string;
    registration: number;
    caution: number;
    monthly: number;
    proratedDays?: number | null;
    total: number;
    dueDate?: string | null;
    qrUrl?: string | null;
    upiId?: string | null;
  }): EmailContent {
    const subject = "Your admission invoice & payment steps";
    const proration = payload.proratedDays ? `<li>Prorated monthly portion: ${payload.proratedDays} days</li>` : "";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your admission invoice is ready (ID: ${payload.invoiceId}).</p>
      <ul>
        <li>Registration (non-refundable): ${formatInr(payload.registration)}</li>
        <li>Caution deposit (refundable): ${formatInr(payload.caution)}</li>
        <li>Monthly fee: ${formatInr(payload.monthly)}</li>
        ${proration}
        <li><strong>Total due:</strong> ${formatInr(payload.total)}</li>
      </ul>
      <p>${payload.dueDate ? `Due date: ${payload.dueDate}. ` : ""}Pay to the static UPI ID${
        payload.upiId ? `: <strong>${payload.upiId}</strong>` : ""
      } and upload the screenshot in your dashboard.</p>
      ${payload.qrUrl ? `<p><img src="${payload.qrUrl}" alt="UPI QR" width="180"/></p>` : ""}
    `;
    return { subject, html: renderEmail({ title: "Admission invoice", body, ctaLabel: "Open dashboard", ctaUrl: `${appUrl}/login` }) };
  },

  credentials(payload: { name: string; email: string; password: string }): EmailContent {
    const subject = "Your Bodhi Edu Hub login credentials";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your Reading Hub account is active.</p>
      <p><strong>Username:</strong> ${payload.email}<br/>
      <strong>Password:</strong> ${payload.password}</p>
      <p>Login and complete onboarding to unlock your dashboard.</p>
    `;
    return { subject, html: renderEmail({ title: "Account ready", body, ctaLabel: "Login", ctaUrl: `${appUrl}/login` }) };
  },

  onboardingReminder(payload: { name: string }): EmailContent {
    const subject = "Complete onboarding to continue";
    const body = `<p>Hi ${payload.name},</p><p>Please finish your onboarding form and ID proof upload to access the student dashboard.</p>`;
    return { subject, html: renderEmail({ title: "Onboarding pending", body, ctaLabel: "Finish onboarding", ctaUrl: `${appUrl}/student/onboarding` }) };
  },

  monthlyDue(payload: { name: string; amount: number; monthLabel: string; qrUrl?: string | null; upiId?: string | null }): EmailContent {
    const subject = `Monthly fee due for ${payload.monthLabel}`;
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your monthly fee of ${formatInr(payload.amount)} is due. Pay via the static UPI QR and upload the screenshot from your dashboard.</p>
      ${payload.upiId ? `<p>UPI ID: <strong>${payload.upiId}</strong></p>` : ""}
      ${payload.qrUrl ? `<p><img src="${payload.qrUrl}" alt="UPI QR" width="180"/></p>` : ""}
    `;
    return { subject, html: renderEmail({ title: "Monthly payment due", body, ctaLabel: "Open dashboard", ctaUrl: `${appUrl}/student` }) };
  },

  paymentProofSubmitted(payload: { studentName: string; amount: number; invoiceId?: string | null; dashboardLink?: string }): EmailContent {
    const subject = `Payment proof submitted by ${payload.studentName}`;
    const body = `
      <p>${payload.studentName} uploaded a payment screenshot${payload.invoiceId ? ` for invoice ${payload.invoiceId}` : ""}.</p>
      <p>Amount reported: ${formatInr(payload.amount)}</p>
      <p>Please review and verify in the billing dashboard.</p>
    `;
    return { subject, html: renderEmail({ title: "Payment proof pending review", body, ctaLabel: "Review now", ctaUrl: payload.dashboardLink || `${appUrl}/staff/billing` }) };
  },

  paymentVerified(payload: { name: string; invoiceId?: string | null; amountApplied?: number | null; nextDueDate?: string | null }): EmailContent {
    const subject = "Payment confirmed";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your payment${payload.invoiceId ? ` for invoice ${payload.invoiceId}` : ""} has been verified.</p>
      ${payload.amountApplied ? `<p>Amount applied: ${formatInr(payload.amountApplied)}</p>` : ""}
      ${payload.nextDueDate ? `<p>Next due date: ${payload.nextDueDate}</p>` : ""}
    `;
    return { subject, html: renderEmail({ title: "Payment verified", body, ctaLabel: "View dashboard", ctaUrl: `${appUrl}/student` }) };
  },

  paymentRejected(payload: { name: string; invoiceId?: string | null; reason?: string; reuploadLink?: string }): EmailContent {
    const subject = "Payment could not be verified";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your payment proof${payload.invoiceId ? ` for invoice ${payload.invoiceId}` : ""} was rejected.</p>
      <p>${payload.reason || "Please upload a clearer screenshot or include the correct reference number."}</p>
    `;
    return {
      subject,
      html: renderEmail({
        title: "Payment proof rejected",
        body,
        ctaLabel: "Re-upload proof",
        ctaUrl: payload.reuploadLink || `${appUrl}/student`,
      }),
    };
  },

  overdueNotice(payload: { name: string; invoiceId?: string | null; amountDue: number; lastDate?: string | null; qrUrl?: string | null; upiId?: string | null }): EmailContent {
    const subject = "Payment overdue – please settle";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your payment${payload.invoiceId ? ` for invoice ${payload.invoiceId}` : ""} is overdue.</p>
      <p>Amount due: ${formatInr(payload.amountDue)}${payload.lastDate ? ` | Last date: ${payload.lastDate}` : ""}</p>
      ${payload.upiId ? `<p>UPI ID: <strong>${payload.upiId}</strong></p>` : ""}
      ${payload.qrUrl ? `<p><img src="${payload.qrUrl}" alt="UPI QR" width="180"/></p>` : ""}
    `;
    return { subject, html: renderEmail({ title: "Overdue notice", body, ctaLabel: "Pay & upload proof", ctaUrl: `${appUrl}/student` }) };
  },

  cautionRefund(payload: { name: string; amount: number; method: string; processedAt?: string | null }): EmailContent {
    const subject = "Caution deposit refunded";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your caution deposit has been refunded.</p>
      <p>Amount: ${formatInr(payload.amount)}<br/>Method: ${payload.method}${payload.processedAt ? `<br/>Processed at: ${payload.processedAt}` : ""}</p>
    `;
    return { subject, html: renderEmail({ title: "Refund processed", body }) };
  },

  examAlert(payload: { title: string; category: string; summary?: string | null; link: string }): EmailContent {
    const subject = `New ${payload.category} update: ${payload.title}`;
    const body = `
      <p>${payload.summary || "A new exam update has been published."}</p>
      <p>Category: <strong>${payload.category}</strong></p>
    `;
    return { subject, html: renderEmail({ title: payload.title, body, ctaLabel: "View details", ctaUrl: payload.link }) };
  },

  postPublished(payload: { title: string; type: "blog" | "note" | "job"; link: string; summary?: string | null }): EmailContent {
    const typeLabel =
      payload.type === "job"
        ? "job opportunity"
        : payload.type === "blog"
          ? "blog post"
          : "note";
    const subject = `New ${typeLabel}: ${payload.title}`;
    const body = `<p>${payload.summary || "A new post is live."}</p>`;
    return { subject, html: renderEmail({ title: payload.title, body, ctaLabel: "Read more", ctaUrl: payload.link }) };
  },

  studentAnnouncement(payload: { title: string; summary?: string | null; link: string }): EmailContent {
    const subject = `New announcement: ${payload.title}`;
    const body = `<p>${payload.summary || "A new announcement has been posted for students."}</p>`;
    return { subject, html: renderEmail({ title: payload.title, body, ctaLabel: "Open announcement", ctaUrl: payload.link }) };
  },

  staffAccount(payload: { name: string; email: string; password: string }): EmailContent {
    const subject = "Your Bodhi staff account";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your staff access has been created.</p>
      <p><strong>Username:</strong> ${payload.email}<br/>
      <strong>Password:</strong> ${payload.password}</p>
    `;
    return { subject, html: renderEmail({ title: "Staff account ready", body, ctaLabel: "Login", ctaUrl: `${appUrl}/login` }) };
  },
};

export type EmailTemplateNames = keyof typeof emailTemplates;
