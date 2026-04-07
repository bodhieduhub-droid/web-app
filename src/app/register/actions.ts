"use server";

import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { notifyProfileIds } from "@/lib/notifications";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitEnquiry(data: {
  name: string;
  phone: string;
  email?: string;
}) {
  const supabase = createAdminClient();
  const name = data.name.trim();
  const phone = data.phone.trim();
  const email = data.email?.trim() || null;

  if (!name || !phone) {
    return { error: "Name and phone are required." };
  }

  const { error } = await supabase.from("enquiries").insert({
    name,
    phone,
    email,
    source: "landing_page",
    status: "new",
  });

  if (error) {
    return { error: error.message };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email")
    .in("role", ["super_admin", "staff"]);

  const profileIds = (profiles ?? []).map((profile) => profile.id);

  if (profileIds.length > 0) {
    await notifyProfileIds(profileIds, {
      category: "enquiry",
      title: "New Bodhi enquiry",
      body: `${name} submitted a new enquiry from the public page.`,
      link: "/super-admin/enquiries",
    });
  }

  const settings = await getHubSettings();
  if (settings.enquiry_notification_emails.length > 0) {
    const teamEmail = emailTemplates.enquiryToTeam({ name, phone, email });
    await sendEmail({
      to: settings.enquiry_notification_emails,
      subject: teamEmail.subject,
      html: teamEmail.html,
      text: teamEmail.text,
    });
  }

  if (email) {
    const ack = emailTemplates.enquiryAcknowledgement({ name });
    await sendEmail({
      to: [email],
      subject: ack.subject,
      html: ack.html,
      text: ack.text,
    });
  }

  return { success: true };
}
