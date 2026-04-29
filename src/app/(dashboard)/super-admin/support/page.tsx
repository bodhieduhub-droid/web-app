import { Suspense } from "react";
import { SupportTicketBoard } from "@/components/dashboard/support-ticket-board";
import type { StudentSupportTicketRecord } from "@/lib/app-types";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { RealtimeTableListener } from "@/components/realtime/realtime-table-listener";

export const dynamic = "force-dynamic";

export default async function SuperAdminSupportPage() {
  return (
    <div className="space-y-6">
      <RealtimeTableListener table="student_support_tickets" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[2.8rem] bg-gray-100" />}>
        <SupportTicketList />
      </Suspense>
    </div>
  );
}

async function SupportTicketList() {
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
