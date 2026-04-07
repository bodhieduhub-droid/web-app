import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

interface CreateNotificationInput {
  audienceType: "profile" | "reader" | "broadcast_role";
  audienceId?: string | null;
  category: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  const supabase = createAdminClient();
  await supabase.from("notifications").insert({
    audience_type: input.audienceType,
    audience_id: input.audienceId ?? null,
    category: input.category,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function notifyProfileIds(
  profileIds: string[],
  notification: Omit<CreateNotificationInput, "audienceType" | "audienceId">,
) {
  await Promise.all(
    profileIds.map((profileId) =>
      createNotification({
        ...notification,
        audienceType: "profile",
        audienceId: profileId,
      }),
    ),
  );
}

export async function notifyReader(
  readerId: string,
  notification: Omit<CreateNotificationInput, "audienceType" | "audienceId">,
) {
  await createNotification({
    ...notification,
    audienceType: "reader",
    audienceId: readerId,
  });
}

export async function emailAndNotifyProfiles(options: {
  profileIds: string[];
  subject: string;
  html: string;
  notification: Omit<CreateNotificationInput, "audienceType" | "audienceId">;
}) {
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", options.profileIds);

  const { data: readers } = await supabase
    .from("readers")
    .select("user_id, email")
    .in("user_id", options.profileIds);

  const emails = (readers ?? [])
    .map((reader) => reader.email)
    .filter((value): value is string => Boolean(value));

  await notifyProfileIds(options.profileIds, options.notification);
  if (profiles && emails.length > 0) {
    await sendEmail({
      to: emails,
      subject: options.subject,
      html: options.html,
    });
  }
}
