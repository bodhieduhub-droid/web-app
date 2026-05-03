"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Assign a biometric_id from the device to an existing student profile.
 * This links all future punches with that ID to the student automatically.
 */
export async function assignBiometricIdAction(formData: FormData) {
  await requireDashboardContext(["super_admin", "staff"]);
  const supabase = createAdminClient();

  const readerId = formData.get("reader_id") as string;
  const biometricId = formData.get("biometric_id") as string;

  if (!readerId || !biometricId) return;

  // 1. Assign the biometric_id on the reader profile
  await supabase
    .from("readers")
    .update({ biometric_id: biometricId })
    .eq("id", readerId);

  // 2. Retroactively link all unmatched logs with this biometric_id to the reader
  await supabase
    .from("biometric_device_logs")
    .update({ reader_id: readerId, status: "matched" })
    .eq("biometric_id", biometricId)
    .eq("status", "unmatched");

  revalidatePath("/super-admin/biometrics");
}

/**
 * Mark a device log as ignored (e.g. test punch, unknown visitor)
 */
export async function ignoreBiometricLogAction(formData: FormData) {
  await requireDashboardContext(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const logId = formData.get("log_id") as string;
  if (!logId) return;

  await supabase
    .from("biometric_device_logs")
    .update({ status: "ignored" })
    .eq("id", logId);

  revalidatePath("/super-admin/biometrics");
}
