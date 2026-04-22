import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StudentOnboardingForm } from "@/components/admin/student-onboarding-form";
import { requireDashboardContext } from "@/lib/auth";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminOnboardStudentPage() {
  await requireDashboardContext(["super_admin"]);
  const supabase = createAdminClient();
  const settings = await getHubSettings();

  const { data: seats } = await supabase
    .from("seats")
    .select("id, seat_number, status")
    .order("seat_number", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/students"
          className="p-2 rounded-full border border-[#d8e0d4] bg-white text-[#1b3022] hover:bg-[#f3f7f0] transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Super Admin Dashboard</p>
          <h1 className="text-3xl font-black text-[#1b3022]">Manual Onboarding</h1>
        </div>
      </div>

      <StudentOnboardingForm seats={seats ?? []} settings={settings} backUrl="/super-admin/students" />
    </div>
  );
}
