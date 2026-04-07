import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForms } from "./_components/settings-form";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  const supabase = createAdminClient();
  const settings = await getHubSettings();
  const [studentsRes, occupiedRes, dueRes, pendingProofRes, pendingExitRes] = await Promise.all([
    supabase
      .from("readers")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "pending_payment", "pending_onboarding"]),
    supabase
      .from("seats")
      .select("id", { count: "exact", head: true })
      .eq("status", "occupied"),
    supabase
      .from("bills")
      .select("amount_due, amount_paid")
      .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"])
      .limit(5000),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("exit_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const openDue = (dueRes.data ?? []).reduce((sum, row) => sum + Math.max(0, Number(row.amount_due) - Number(row.amount_paid)), 0);
  const occupancy = settings.seat_capacity > 0 ? Math.round(((occupiedRes.count ?? 0) / settings.seat_capacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Settings</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Platform Configuration</h1>
        <p className="mt-2 text-sm font-semibold text-[#536352]">Control billing defaults, payment channels, alerts, and reset operations from one place.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Active Students", value: studentsRes.count ?? 0 },
          { label: "Seat Occupancy", value: `${occupiedRes.count ?? 0}/${settings.seat_capacity} (${occupancy}%)` },
          { label: "Open Due", value: `₹${Math.round(openDue)}` },
          { label: "Pending Proofs", value: pendingProofRes.count ?? 0 },
          { label: "Pending Exits", value: pendingExitRes.count ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
          </div>
        ))}
      </section>

      <SettingsForms settings={settings} />
    </div>
  );
}
