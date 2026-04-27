import "server-only";

import { redirect } from "next/navigation";

import type { DashboardContext, StudentRecord } from "@/lib/app-types";
import { normalizeRole, type AppRole } from "@/lib/billing-utils";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardContext(): Promise<DashboardContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, onboarding_required")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const normalizedRole = normalizeRole(profile.role);
  if (!normalizedRole) {
    return null;
  }

  let student: StudentRecord | null = null;
  if (normalizedRole === "student") {
    const { data: studentRecord } = await supabase
      .from("readers")
      .select("id, name, user_id, status, reader_type, monthly_fee, onboarding_completed, onboarding_completed_at, address, purpose, preparing_for_exam, exam_details, id_proof_url, id_proof_public_id, fixed_seat_id")
      .eq("user_id", user.id)
      .maybeSingle();
    student = (studentRecord as StudentRecord | null) ?? null;
  }

  return {
    profile,
    normalizedRole,
    student,
  };
}

export async function requireDashboardContext(
  allowedRoles?: AppRole[],
): Promise<DashboardContext> {
  const context = await getDashboardContext();
  if (!context) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(context.normalizedRole)) {
    if (context.normalizedRole === "super_admin") redirect("/super-admin");
    if (context.normalizedRole === "staff") redirect("/staff");
    redirect("/student");
  }

  return context;
}
