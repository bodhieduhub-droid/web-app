"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateEnquiryStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/super-admin/enquiries/kanban");
  revalidatePath("/super-admin/enquiries");
  return { success: true };
}
