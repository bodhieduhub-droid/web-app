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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.bodhieduhub.com";
const brand = "Bodhi Edu Hub";
const primaryColor = "#1b3022";
const textColor = "#2c3e2e";
const bgColor = "#f3f4f6";

/**
 * Basic But Branded Email Renderer
 * Focused on maximum compatibility across all devices and email clients.
 * Uses a single-column layout with brand-aligned colors.
 */
function renderEmail(options: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; background-color: ${bgColor}; font-family: sans-serif; color: ${textColor}; }
    table { border-spacing: 0; font-family: sans-serif; color: ${textColor}; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: ${bgColor}; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: ${textColor}; border-radius: 8px; overflow: hidden; margin-top: 40px; }
    .header { background-color: ${primaryColor}; padding: 30px; text-align: center; color: #ffffff; }
    .content { padding: 40px 30px; line-height: 1.6; font-size: 16px; }
    .button-container { padding: 0 30px 40px 30px; text-align: center; }
    .button { background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; display: inline-block; }
    .footer { padding: 30px; text-align: center; font-size: 13px; color: #666666; }
    h1 { font-size: 24px; margin-top: 0; color: ${primaryColor}; }
    p { margin-top: 0; margin-bottom: 16px; }
    .info-list { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .info-item { margin-bottom: 8px; border-bottom: 1px solid #eeeeee; padding-bottom: 8px; }
    .info-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    
    @media only screen and (max-width: 600px) {
      .main { width: 100% !important; margin-top: 0 !important; border-radius: 0 !important; }
      .content { padding: 30px 20px !important; }
      .button { width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" align="center">
      <tr>
        <td class="header">
          <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">${brand}</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h1>${options.title}</h1>
          <div style="color: #444444;">
            ${options.body}
          </div>
        </td>
      </tr>
      ${options.ctaLabel && options.ctaUrl ? `
      <tr>
        <td class="button-container">
          <a href="${options.ctaUrl}" class="button">${options.ctaLabel}</a>
        </td>
      </tr>
      ` : ""}
      <tr>
        <td class="footer">
          <p>${options.footerNote || `Thank you for being part of ${brand}.`}</p>
          <p>&copy; ${year} ${brand} | <a href="${appUrl}" style="color: ${primaryColor};">${appUrl.replace("https://", "")}</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Simple data row for compatibility
 */
function dataBox(items: { label: string; value: string }[]) {
  return `<div class="info-list">
    ${items.map(item => `
      <div class="info-item">
        <strong style="color: ${primaryColor};">${item.label}:</strong> ${item.value}
      </div>
    `).join("")}
  </div>`;
}

export const emailTemplates = {
  enquiryToTeam(payload: { name: string; phone: string; email?: string | null }): EmailContent {
    const subject = `New enquiry: ${payload.name}`;
    const body = `
      <p>A new enquiry has been submitted.</p>
      ${dataBox([
        { label: "Name", value: payload.name },
        { label: "Phone", value: payload.phone },
        { label: "Email", value: payload.email || "Not provided" }
      ])}
    `;
    return { subject, html: renderEmail({ title: "New Lead Notification", body, ctaLabel: "View Leads", ctaUrl: `${appUrl}/staff/leads` }) };
  },

  enquiryAcknowledgement(payload: { name: string }): EmailContent {
    const subject = "Enquiry Received - Bodhi Edu Hub";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Thank you for your enquiry. Our team will contact you soon regarding seat availability and pricing.</p>
      <p>We look forward to having you at our Reading Hub.</p>
    `;
    return { subject, html: renderEmail({ title: "Thanks for your interest", body }) };
  },

  seatAvailable(payload: { name: string; seatLabel?: string }): EmailContent {
    const subject = "Seat Available - Bodhi Edu Hub";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>A seat is now available for you${payload.seatLabel ? ` (Seat: <strong>${payload.seatLabel}</strong>)` : ""}.</p>
      <p>Please log in to complete your admission and secure your spot.</p>
    `;
    return { subject, html: renderEmail({ title: "Your Seat is Ready", body, ctaLabel: "Log in to Dashboard", ctaUrl: `${appUrl}/login` }) };
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
    const subject = `Admission Invoice: ${payload.invoiceId}`;
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your admission invoice is ready. Fee details:</p>
      ${dataBox([
        { label: "Invoice ID", value: payload.invoiceId },
        { label: "Registration", value: formatInr(payload.registration) },
        { label: "Caution Deposit", value: formatInr(payload.caution) },
        { label: "Monthly Fee", value: formatInr(payload.monthly) },
        { label: "Total Due", value: `<strong>${formatInr(payload.total)}</strong>` }
      ])}
      <p>Please pay to UPI ID: <strong>${payload.upiId || "bodhieduhub@upi"}</strong> ${payload.dueDate ? `by <strong>${payload.dueDate}</strong>` : ""}.</p>
      <p>After payment, please upload the screenshot in your portal.</p>
    `;
    return { subject, html: renderEmail({ title: "Invoice Details", body, ctaLabel: "Go to Portal", ctaUrl: `${appUrl}/student` }) };
  },

  credentials(payload: { name: string; email: string; password: string }): EmailContent {
    const subject = "Your Bodhi Edu Hub Login";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your account is active. Use these credentials to log in:</p>
      ${dataBox([
        { label: "Username", value: payload.email },
        { label: "Password", value: payload.password }
      ])}
      <p>Please change your password after logging in.</p>
    `;
    return { subject, html: renderEmail({ title: "Account Ready", body, ctaLabel: "Login Now", ctaUrl: `${appUrl}/login` }) };
  },

  onboardingReminder(payload: { name: string }): EmailContent {
    const subject = "Complete onboarding to continue";
    const body = `<p>Hi ${payload.name},</p><p>Please finish your onboarding form and ID proof upload to access the student dashboard.</p>`;
    return { subject, html: renderEmail({ title: "Onboarding pending", body, ctaLabel: "Finish onboarding", ctaUrl: `${appUrl}/student/onboarding` }) };
  },

  monthlyDue(payload: { name: string; amount: number; monthLabel: string; qrUrl?: string | null; upiId?: string | null }): EmailContent {
    const subject = `Fee Due: ${payload.monthLabel}`;
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your membership fee for <strong>${payload.monthLabel}</strong> is due.</p>
      ${dataBox([
        { label: "Amount", value: formatInr(payload.amount) },
        { label: "Month", value: payload.monthLabel }
      ])}
      <p>Pay to: <strong>${payload.upiId || "bodhieduhub@upi"}</strong> and upload proof in dashboard.</p>
    `;
    return { subject, html: renderEmail({ title: "Payment Reminder", body, ctaLabel: "Open Dashboard", ctaUrl: `${appUrl}/student` }) };
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
    const subject = "Payment Verified - Bodhi Edu Hub";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your payment has been successfully verified.</p>
      ${dataBox([
        { label: "Invoice", value: payload.invoiceId || "N/A" },
        { label: "Amount", value: payload.amountApplied ? formatInr(payload.amountApplied) : "Verified" }
      ])}
      <p>Thank you for your payment.</p>
    `;
    return { subject, html: renderEmail({ title: "Payment Confirmed", body, ctaLabel: "View Account", ctaUrl: `${appUrl}/student` }) };
  },

  paymentRejected(payload: { name: string; invoiceId?: string | null; reason?: string; reuploadLink?: string }): EmailContent {
    const subject = "Payment Verification Failed";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>We couldn't verify your payment proof.</p>
      <p><strong>Reason:</strong> ${payload.reason || "Screenshot unclear or invalid transaction ID."}</p>
      <p>Please re-upload a clear proof in your dashboard.</p>
    `;
    return { subject, html: renderEmail({ title: "Action Required", body, ctaLabel: "Re-upload Proof", ctaUrl: `${appUrl}/student` }) };
  },

  overdueNotice(payload: { name: string; invoiceId?: string | null; amountDue: number; lastDate?: string | null; qrUrl?: string | null; upiId?: string | null }): EmailContent {
    const subject = "URGENT: Payment Overdue";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your payment is overdue. Please settle the balance to keep your seat reserved.</p>
      ${dataBox([
        { label: "Balance Due", value: formatInr(payload.amountDue) }
      ])}
    `;
    return { subject, html: renderEmail({ title: "Overdue Notice", body, ctaLabel: "Pay Now", ctaUrl: `${appUrl}/student` }) };
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
    const subject = `[Update] ${payload.category}: ${payload.title}`;
    const body = `
      <p>A new exam update is available for <strong>${payload.category}</strong>.</p>
      <p><strong>${payload.title}</strong></p>
      <p>Click below to view the full details.</p>
    `;
    return { subject, html: renderEmail({ title: "New Notification", body, ctaLabel: "View Details", ctaUrl: payload.link }) };
  },

  postPublished(payload: { title: string; type: string; summary?: string | null; link: string }): EmailContent {
    const subject = `New ${payload.type}: ${payload.title}`;
    const body = `
      <p>We've published a new ${payload.type}.</p>
      <p><strong>${payload.title}</strong></p>
    `;
    return { subject, html: renderEmail({ title: "New Post", body, ctaLabel: "Read More", ctaUrl: payload.link }) };
  },

  studentAnnouncement(payload: { title: string; summary?: string | null; link: string }): EmailContent {
    const subject = `Announcement: ${payload.title}`;
    const body = `<p>${payload.summary || "A new announcement has been posted for students."}</p>`;
    return { subject, html: renderEmail({ title: payload.title, body, ctaLabel: "Open announcement", ctaUrl: payload.link }) };
  },

  staffAccount(payload: { name: string; email: string; password: string }): EmailContent {
    const subject = "Your Staff Account Access";
    const body = `
      <p>Hi ${payload.name},</p>
      <p>Your staff access is ready:</p>
      ${dataBox([
        { label: "Email", value: payload.email },
        { label: "Password", value: payload.password }
      ])}
    `;
    return { subject, html: renderEmail({ title: "Welcome to the Team", body, ctaLabel: "Admin Login", ctaUrl: `${appUrl}/login` }) };
  },
};

export type EmailTemplateNames = keyof typeof emailTemplates;
