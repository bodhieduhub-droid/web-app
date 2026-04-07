import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from("readers")
    .select("id, name, email")
    .eq("status", "pending_onboarding");

  let remindersSent = 0;

  for (const student of students ?? []) {
    await createNotification({
      audienceType: "reader",
      audienceId: student.id,
      category: "account",
      title: "Onboarding pending",
      body: `Please finish your onboarding form and ID proof upload to access the dashboard.`,
      link: "/student/onboarding",
    });

    if (student.email) {
      const emailTemplate = emailTemplates.onboardingReminder({
        name: student.name,
      });
      await sendEmail({
        to: [student.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      remindersSent += 1;
    }
  }

  return NextResponse.json({ success: true, remindersSent });
}
