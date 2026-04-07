import "server-only";

interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

type BatchOptions = {
  chunkSize?: number;
  delayMs?: number;
};

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM,
  };
}

export async function sendEmail(payload: EmailPayload) {
  const { apiKey, from } = getEmailConfig();
  if (!apiKey || !from || payload.to.length === 0) {
    return { skipped: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed: ${body}`);
  }

  return response.json();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailBatched(payload: EmailPayload, options?: BatchOptions) {
  const to = payload.to.filter(Boolean);
  if (to.length === 0) return { skipped: true as const, batches: 0, recipients: 0 };

  const chunkSize = Math.max(1, options?.chunkSize ?? 40);
  const delayMs = Math.max(0, options?.delayMs ?? 250);
  const chunks: string[][] = [];
  for (let i = 0; i < to.length; i += chunkSize) {
    chunks.push(to.slice(i, i + chunkSize));
  }

  const results: unknown[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const batch = chunks[index];
    const result = await sendEmail({
      ...payload,
      to: batch,
    });
    results.push(result);
    if (index < chunks.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return {
    batches: chunks.length,
    recipients: to.length,
    results,
  };
}
