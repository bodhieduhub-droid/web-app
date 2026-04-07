"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loginWithPassword(email: string, password: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Ensure this email belongs to a super_admin
  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (usersErr || !usersData?.users) {
    return { error: "Failed to verify admin status." };
  }

  const user = usersData.users.find((u) => u.email === email);
  if (!user) {
    return { error: "Access denied. Unrecognized admin." };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    return { error: "Access denied. Insufficient privileges." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
