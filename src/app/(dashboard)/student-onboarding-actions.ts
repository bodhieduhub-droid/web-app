"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { sendEmail } from "@/lib/email";
import { createNotification, notifyReader } from "@/lib/notifications";

async function requireRole(allowedRoles: ("super_admin" | "staff")[]) {
  return requireDashboardContext(allowedRoles);
}

async function notifyActor(profileId: string, title: string, body: string) {
  await createNotification({
    audienceType: "profile",
    audienceId: profileId,
    category: "system",
    title,
    body,
  });
}

export async function rejectStudentIdProofAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = formData.get("reader_id") as string;

  if (!readerId) return;

  const { data: student } = await supabase
    .from("readers")
    .select("id, id_proof_public_id, email, name, user_id")
    .eq("id", readerId)
    .maybeSingle();

  if (!student) return;

  // 1. Reset database fields
  await supabase
    .from("readers")
    .update({
      id_proof_url: null,
      id_proof_public_id: null,
      onboarding_completed: false,
      id_proof_verified: false,
    })
    .eq("id", readerId);

  const sideEffects = [];

  // 2. Delete from Cloudinary
  if (student.id_proof_public_id) {
    sideEffects.push(deleteFromCloudinary(student.id_proof_public_id).catch(e => console.error("[rejectID] Cloudinary delete failed:", e)));
  }

  // 3. Email Notification
  if (student.email) {
    sideEffects.push(sendEmail({
      to: [student.email],
      subject: "ID Proof Rejected - Re-upload Required",
      html: `<p>Hi ${student.name},</p><p>The ID proof you uploaded during onboarding was rejected. Please log in to your dashboard and re-upload a clear, valid ID proof.</p>`,
      text: `Hi ${student.name},\n\nThe ID proof you uploaded during onboarding was rejected. Please log in to your dashboard and re-upload a clear, valid ID proof.\n`,
    }));
  }

  // 4. In-app Notification
  if (student.user_id) {
    sideEffects.push(notifyReader(student.id, {
      category: "account",
      title: "ID Proof Rejected",
      body: "Your uploaded ID proof was rejected. Please re-upload a clear, valid ID proof.",
      link: "/student/onboarding",
    }));
  }

  // 5. Admin Log
  sideEffects.push(notifyActor(profile.id, "ID Proof Rejected", `ID proof for ${student.name} has been rejected.`));
  
  await Promise.allSettled(sideEffects);

  // 6. Revalidate
  revalidatePath("/super-admin/students");
  revalidatePath(`/super-admin/students/${readerId}`);
  revalidatePath("/staff/students");
}
