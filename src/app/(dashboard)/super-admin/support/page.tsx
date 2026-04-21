import { SupportTicketBoard } from "@/components/dashboard/support-ticket-board";
import type { StudentSupportTicketRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminSupportPage() {
  await requireDashboardContext(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const { data: tickets } = await supabase
    .from("student_support_tickets")
    .select("*, readers(name, email, phone)")
    .order("created_at", { ascending: false });

  return (
    <SupportTicketBoard
      heading="Student Support Tickets"
      tickets={(tickets ?? []) as (StudentSupportTicketRecord & {
        readers?: { name?: string | null; email?: string | null; phone?: string | null } | null;
      })[]}
    />
  );
}
