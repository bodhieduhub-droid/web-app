import { requireDashboardContext } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function StudentOnboardingPage() {
  const { student } = await requireDashboardContext(["student"]);

  if (!student) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm font-bold uppercase tracking-widest text-[#6a7b69]">
          Student profile not found.
        </p>
      </div>
    );
  }

  return <OnboardingForm student={student} />;
}
