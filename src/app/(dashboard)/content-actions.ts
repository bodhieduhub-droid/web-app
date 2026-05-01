"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary, uploadToCloudinary } from "@/lib/cloudinary";
import { sendEmailBatched } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { notifyReader } from "@/lib/notifications";
import { getISTDateString, getISTTimestamp } from "@/lib/date-utils";
import { type AppRole } from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  getNumber,
  getFile,
  getIsoDateTime,
  revalidateCalendarPaths,
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_AUDIENCES,
  CALENDAR_EVENT_STATUSES,
} from "./actions-utils";

async function requireRole(allowedRoles: AppRole[]) {
  return requireDashboardContext(allowedRoles);
}

async function deliverPublishedPostUpdate(post: {
  type: "blog" | "note" | "job" | "exam_alert";
  audience: "public" | "student";
  exam_category?: string | null;
  title: string;
  summary: string | null;
  link_url?: string | null;
}) {
  const supabase = createAdminClient();
  const sideEffects = [];

  if (post.type === "exam_alert" && post.exam_category) {
    const { data: interestedStudents } = await supabase.from("student_exam_interests").select("reader_id, readers(email)").eq("category", post.exam_category);

    const readerIds = (interestedStudents ?? []).map((row) => row.reader_id);
    const emails = (interestedStudents ?? []).map((row) => (row.readers as { email?: string } | null)?.email ?? "").filter(Boolean);

    sideEffects.push(...readerIds.map((readerId) => notifyReader(readerId, {
      category: "exam_alert",
      title: post.title,
      body: post.summary || "A new exam update has been published.",
      link: "/student/exams",
    })));

    if (emails.length > 0) {
      const emailTemplate = emailTemplates.examAlert({
        title: post.title,
        category: post.exam_category,
        summary: post.summary,
        link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/exams`,
      });
      sideEffects.push(sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }));
    }
  } else if (post.audience === "student") {
    const { data: studentRows } = await supabase.from("readers").select("id, email").in("status", ["active", "pending_payment", "pending_onboarding"]).not("email", "is", null);

    const readerIds = (studentRows ?? []).map((row) => row.id);
    const emails = (studentRows ?? []).map((row) => row.email).filter(Boolean);

    sideEffects.push(...readerIds.map((readerId) => notifyReader(readerId, {
      category: "announcement",
      title: post.title,
      body: post.summary || "A new student announcement has been posted.",
      link: "/student/announcements",
    })));

    if (emails.length > 0) {
      const emailTemplate = emailTemplates.studentAnnouncement({
        title: post.title,
        summary: post.summary,
        link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/announcements`,
      });
      sideEffects.push(sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }));
    }
  } else if (post.type === "blog" || post.type === "note" || post.type === "job") {
    const { data: activeReaders } = await supabase.from("readers").select("email").eq("status", "active").not("email", "is", null);

    const emails = (activeReaders ?? []).map((r) => r.email).filter(Boolean);
    if (emails.length > 0) {
      const emailTemplate = emailTemplates.postPublished({
        title: post.title,
        type: post.type as "blog" | "note" | "job",
        summary: post.summary,
        link: post.link_url || `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}${post.type === "blog" ? "/blogs" : post.type === "job" ? "/job-opportunities" : "/notes"}`,
      });
      sideEffects.push(sendEmailBatched({
        to: emails,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }));
    }
  }

  await Promise.allSettled(sideEffects);
}

export async function createPostAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const rawType = getString(formData, "type");
  const isAnnouncement = rawType === "announcement";
  const type = isAnnouncement ? "note" : rawType;
  const audience = isAnnouncement ? "student" : getString(formData, "audience");
  const examCategory = getOptionalString(formData, "exam_category");
  const targetStatus = getOptionalString(formData, "target_status");
  const targetExamCategory = getOptionalString(formData, "target_exam_category");
  const onlyExamPreparing = getString(formData, "only_exam_preparing") === "yes";
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const status = getString(formData, "status") || "draft";

  if (!type || !audience || !title || !content) return;
  if (!["blog", "note", "job", "exam_alert"].includes(type)) return;

  const { data: post } = await supabase.from("posts").insert({
    type,
    audience,
    exam_category: examCategory,
    title,
    summary,
    content,
    link_url: linkUrl,
    status,
    author_profile_id: profile.id,
    published_at: status === "published" ? getISTTimestamp() : null,
  }).select("*").single();

  if (post && post.status === "published") {
    if (post.type === "exam_alert" && post.exam_category) {
      await deliverPublishedPostUpdate({ type: "exam_alert", audience: "student", exam_category: post.exam_category, title: post.title, summary: post.summary, link_url: post.link_url });
    } else if (isAnnouncement) {
      const sideEffects = [];
      let targetedReaderIds: string[] | null = null;
      if (targetExamCategory) {
        const { data: interestRows } = await supabase.from("student_exam_interests").select("reader_id").eq("category", targetExamCategory);
        targetedReaderIds = (interestRows ?? []).map((row) => row.reader_id);
      }

      let readersQuery = supabase.from("readers").select("id, email").in("status", targetStatus ? [targetStatus] : ["active", "pending_payment", "pending_onboarding"]).not("email", "is", null);
      if (onlyExamPreparing) readersQuery = readersQuery.eq("preparing_for_exam", true);
      if (targetedReaderIds) readersQuery = targetedReaderIds.length > 0 ? readersQuery.in("id", targetedReaderIds) : readersQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);

      const { data: studentRows } = await readersQuery;
      const readerIds = (studentRows ?? []).map((row) => row.id);
      const emails = (studentRows ?? []).map((row) => row.email).filter(Boolean);

      sideEffects.push(...readerIds.map((readerId) => notifyReader(readerId, {
        category: "announcement",
        title: post.title,
        body: post.summary || "A new student announcement has been posted.",
        link: "/student/announcements",
      })));

      if (emails.length > 0) {
        const emailTemplate = emailTemplates.studentAnnouncement({
          title: post.title,
          summary: post.summary,
          link: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bodhieduhub.com"}/student/announcements`,
        });
        sideEffects.push(sendEmailBatched({
          to: emails,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        }));
      }

      sideEffects.push(supabase.from("posts").update({
        summary: post.summary || `Delivered to ${readerIds.length} students via portal and ${emails.length} emails.`,
      }).eq("id", post.id));

      await Promise.allSettled(sideEffects);
    } else if (post.type === "blog" || post.type === "note" || post.type === "job") {
      await deliverPublishedPostUpdate({ type: post.type as any, audience: post.audience as any, title: post.title, summary: post.summary, link_url: post.link_url });
    }
  }

  revalidatePath("/super-admin/content");
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
}

export async function createBlogPostAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const status = getString(formData, "status") || "draft";
  const coverImage = getFile(formData, "cover_image");

  if (!title || !content) return;
  if (!["draft", "published"].includes(status)) return;

  let uploadedCover: { secureUrl: string; publicId: string } | null = null;
  if (coverImage) {
    uploadedCover = await uploadToCloudinary(coverImage, "bodhi-blog-covers");
  }

  const { data: post } = await supabase.from("posts").insert({
    type: "blog",
    audience: "public",
    title,
    summary,
    content,
    link_url: linkUrl,
    cover_image_url: uploadedCover?.secureUrl ?? null,
    cover_image_public_id: uploadedCover?.publicId ?? null,
    status,
    author_profile_id: profile.id,
    published_at: status === "published" ? getISTTimestamp() : null,
  }).select("*").single();

  if (post?.status === "published") {
    await deliverPublishedPostUpdate({ type: "blog", audience: "public", title: post.title, summary: post.summary, link_url: post.link_url });
  }

  revalidatePath("/super-admin/content");
  revalidatePath("/staff/content");
  revalidatePath("/blogs");
  revalidatePath("/");
}

export async function updatePostAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const type = getString(formData, "type");
  const audience = getString(formData, "audience");
  const examCategory = getOptionalString(formData, "exam_category");
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const content = getString(formData, "content");
  const linkUrl = getOptionalString(formData, "link_url");
  const coverImage = getFile(formData, "cover_image");
  const status = getString(formData, "status");

  if (!postId || !type || !audience || !title || !content) return;
  if (!["blog", "note", "job", "exam_alert"].includes(type)) return;
  if (!["public", "student"].includes(audience)) return;
  if (!["draft", "published", "archived"].includes(status)) return;

  const { data: previous } = await supabase.from("posts").select("status, cover_image_public_id").eq("id", postId).maybeSingle();

  let nextCoverImageUrl: string | null | undefined = undefined;
  let nextCoverImagePublicId: string | null | undefined = undefined;

  if (coverImage && type === "blog") {
    const uploadedCover = await uploadToCloudinary(coverImage, "bodhi-blog-covers");
    nextCoverImageUrl = uploadedCover.secureUrl;
    nextCoverImagePublicId = uploadedCover.publicId;

    if (previous?.cover_image_public_id) {
      await deleteFromCloudinary(previous.cover_image_public_id).catch(() => {});
    }
  }

  await supabase.from("posts").update({
    type,
    audience,
    exam_category: examCategory,
    title,
    summary,
    content,
    link_url: linkUrl,
    ...(type === "blog" && nextCoverImageUrl !== undefined ? { cover_image_url: nextCoverImageUrl, cover_image_public_id: nextCoverImagePublicId ?? null } : {}),
    status,
    published_at: status === "published" ? getISTTimestamp() : null,
  }).eq("id", postId);

  if (status === "published" && previous?.status !== "published") {
    await deliverPublishedPostUpdate({ type: type as any, link_url: linkUrl, audience: audience as any, exam_category: examCategory, title, summary });
  }

  revalidatePath("/super-admin/content");
  revalidatePath(`/super-admin/content/${postId}`);
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
}

export async function quickUpdatePostStatusAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const postId = getString(formData, "post_id");
  const status = getString(formData, "status");
  if (!postId || !["draft", "published", "archived"].includes(status)) return;

  const { data: previous } = await supabase.from("posts").select("status, type, audience, exam_category, title, summary, link_url").eq("id", postId).maybeSingle();

  await supabase.from("posts").update({ status, published_at: status === "published" ? getISTTimestamp() : null }).eq("id", postId);

  if (status === "published" && previous && previous.status !== "published") {
    await deliverPublishedPostUpdate({ type: previous.type as any, link_url: previous.link_url, audience: previous.audience as any, exam_category: previous.exam_category, title: previous.title, summary: previous.summary });
  }

  revalidatePath("/super-admin/content");
  revalidatePath(`/super-admin/content/${postId}`);
  revalidatePath("/staff/content");
  revalidatePath("/");
  revalidatePath("/student");
}

export async function createCalendarEventAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const description = getOptionalString(formData, "description") ?? "";
  const eventType = getString(formData, "event_type");
  const audience = getString(formData, "audience") || "student";
  const examCategory = getOptionalString(formData, "exam_category");
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const location = getOptionalString(formData, "location");
  const linkUrl = getOptionalString(formData, "link_url");
  const sourcePostId = getOptionalString(formData, "source_post_id");
  const status = getString(formData, "status") || "draft";

  if (!title || !startsAt) return;
  if (!CALENDAR_EVENT_TYPES.has(eventType)) return;
  if (!CALENDAR_EVENT_AUDIENCES.has(audience)) return;
  if (!CALENDAR_EVENT_STATUSES.has(status)) return;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) return;

  await supabase.from("calendar_events").insert({
    title, summary, description, event_type: eventType, audience, exam_category: examCategory,
    starts_at: startsAt, ends_at: endsAt, is_all_day: isAllDay, location, link_url: linkUrl,
    source_post_id: sourcePostId, status, author_profile_id: profile.id,
  });

  revalidateCalendarPaths();
}

export async function updateCalendarEventAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const eventId = getString(formData, "event_id");
  const title = getString(formData, "title");
  const summary = getOptionalString(formData, "summary");
  const description = getOptionalString(formData, "description") ?? "";
  const eventType = getString(formData, "event_type");
  const audience = getString(formData, "audience") || "student";
  const examCategory = getOptionalString(formData, "exam_category");
  const startsAt = getIsoDateTime(getString(formData, "starts_at"));
  const endsAt = getIsoDateTime(getOptionalString(formData, "ends_at"));
  const isAllDay = getString(formData, "is_all_day") !== "no";
  const location = getOptionalString(formData, "location");
  const linkUrl = getOptionalString(formData, "link_url");
  const sourcePostId = getOptionalString(formData, "source_post_id");
  const status = getString(formData, "status") || "draft";

  if (!eventId || !title || !startsAt) return;
  if (!CALENDAR_EVENT_TYPES.has(eventType)) return;
  if (!CALENDAR_EVENT_AUDIENCES.has(audience)) return;
  if (!CALENDAR_EVENT_STATUSES.has(status)) return;
  if (endsAt && new Date(endsAt) < new Date(startsAt)) return;

  await supabase.from("calendar_events").update({
    title, summary, description, event_type: eventType, audience, exam_category: examCategory,
    starts_at: startsAt, ends_at: endsAt, is_all_day: isAllDay, location, link_url: linkUrl,
    source_post_id: sourcePostId, status,
  }).eq("id", eventId);

  revalidateCalendarPaths();
}

export async function deleteCalendarEventAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const eventId = getString(formData, "event_id");
  if (!eventId) return;

  await supabase.from("calendar_events").delete().eq("id", eventId);
  revalidateCalendarPaths();
}

export async function createExpenseAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  
  const amount = getNumber(formData, "amount", 0);
  const category = getString(formData, "category");
  const description = getOptionalString(formData, "description");
  const date = getString(formData, "date") || getISTDateString();

  if (amount <= 0 || !category) return { error: "Please provide a valid amount and category." };

  const { error } = await supabase.from("expenses").insert({
    amount, category, description, date, recorded_by_profile_id: profile.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
  return { success: true };
}

export async function updateExpenseAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  
  const id = getString(formData, "id");
  const amount = getNumber(formData, "amount", 0);
  const category = getString(formData, "category");
  const description = getOptionalString(formData, "description");
  const date = getString(formData, "date");

  if (!id || amount <= 0 || !category) return { error: "Invalid data." };

  const { error } = await supabase.from("expenses").update({ amount, category, description, date }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
  return { success: true };
}

export async function deleteExpenseAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const id = getString(formData, "id");
  if (!id) return;

  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/super-admin/expenses");
  revalidatePath("/staff/expenses");
}
