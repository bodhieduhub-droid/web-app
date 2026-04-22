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

function renderEmail(options: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${options.title}</title>
  <!--[if mso]>
  <noscript>
  <xml>
  <o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
      background-color: #f3f4f6;
    }
    table {
      border-collapse: collapse;
    }
    /* Light Mode Default */
    .wrapper { background-color: #f3f4f6; }
    .container { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .brand { color: #111827 !important; }
    .title { color: #1f2937 !important; border-bottom: 1px solid #e5e7eb !important; }
    .body-text { color: #4b5563 !important; }
    .btn { background-color: #0f172a !important; color: #ffffff !important; }
    .footer { color: #6b7280 !important; border-top: 1px solid #e5e7eb !important; }
    .footer-note { color: #9ca3af !important; }
    .logo-box { background-color: #0f172a !important; color: #ffffff !important; }
    .link { color: #2563eb !important; text-decoration: underline !important; }

    /* Dark Mode */
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #111827 !important; }
      .container { background-color: #1f2937 !important; border-color: #374151 !important; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important; }
      .brand { color: #f9fafb !important; }
      .title { color: #f3f4f6 !important; border-color: #374151 !important; }
      .body-text { color: #d1d5db !important; }
      .btn { background-color: #3b82f6 !important; color: #ffffff !important; }
      .footer { color: #9ca3af !important; border-color: #374151 !important; }
      .footer-note { color: #6b7280 !important; }
      .logo-box { background-color: #3b82f6 !important; color: #ffffff !important; }
      strong { color: #f9fafb !important; }
      h1, h2, h3, h4, h5, h6 { color: #f3f4f6 !important; }
      .link, a { color: #60a5fa !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td align="center" style="padding-bottom: 24px; font-family: 'Inter', Helvetica, Arial, sans-serif;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td class="logo-box" align="center" valign="middle" style="width: 48px; height: 48px; background-color: #0f172a; border-radius: 12px; font-size: 24px; font-weight: 800; color: #ffffff;">
                    B
                  </td>
                </tr>
              </table>
              <div class="brand" style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #111827; margin-top: 16px;">${brand}</div>
            </td>
          </tr>
          <tr>
            <td class="title" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; padding: 8px 0 20px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
              ${options.title}
            </td>
          </tr>
          <tr>
            <td class="body-text" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #4b5563; padding-top: 24px;">
              ${options.body}
            </td>
          </tr>
          ${
            options.ctaLabel && options.ctaUrl
              ? `<tr>
                  <td align="center" style="padding: 32px 0 16px 0;">
                    <a href="${options.ctaUrl}" class="btn" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 15px;">${options.ctaLabel}</a>
                  </td>
                </tr>`
              : ""
          }
          <tr>
            <td class="footer" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #6b7280; padding-top: 32px; border-top: 1px solid #e5e7eb; margin-top: 32px; text-align: center;">
              ${options.footerNote || "You are receiving this because you have an account or enquiry with Bodhi Edu Hub."}
            </td>
          </tr>
        </table>
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="padding: 20px 0;">
          <tr>
            <td align="center" class="footer-note" style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #9ca3af;">
              &copy; ${new Date().getFullYear()} ${brand}. All rights reserved.<br>
              <a href="${appUrl}" class="link" style="color: #2563eb; text-decoration: underline;">Visit our website</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
