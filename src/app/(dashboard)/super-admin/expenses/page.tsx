import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExpenseManagement } from "@/components/admin/expense-management";

export const dynamic = "force-dynamic";

export default async function SuperAdminExpensesPage() {
  await requireDashboardContext(["super_admin"]);
  const supabase = createAdminClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles:recorded_by_profile_id(full_name)")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <ExpenseManagement initialExpenses={expenses || []} />
    </div>
  );
}
