import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ExpenseManagement } from "@/components/admin/expense-management";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

export const dynamic = "force-dynamic";

export default async function SuperAdminExpensesPage() {
  return (
    <div className="space-y-6">
      <RealtimeTableListener table="expenses" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[2.8rem] bg-gray-100" />}>
        <ExpenseListContainer />
      </Suspense>
    </div>
  );
}

async function ExpenseListContainer() {
  await requireDashboardContext(["super_admin"]);
  const supabase = createAdminClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles:recorded_by_profile_id(full_name)")
    .order("date", { ascending: false });

  return <ExpenseManagement initialExpenses={expenses || []} />;
}
