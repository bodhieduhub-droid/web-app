import Link from "next/link";
import { Bot } from "lucide-react";

import { finalizeFinance, getFinancePeriodWindow, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";

function MetricCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{label}</p>
      <p className="mt-4 text-4xl font-black text-[#1b3022]">{value}</p>
    </Link>
  );
}

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const dailyWindow = getFinancePeriodWindow("daily");
  const weeklyWindow = getFinancePeriodWindow("weekly");
  const monthlyWindow = getFinancePeriodWindow("monthly");

  const { count: enquiryCount } = await supabase
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "contacted", "seat_blocked"]);

  const { count: studentCount } = await supabase
    .from("readers")
    .select("*", { count: "exact", head: true });

  const { count: availableSeats } = await supabase
    .from("seats")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");

  const { count: openBills } = await supabase
    .from("bills")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]);

  const { count: overdueBills } = await supabase
    .from("bills")
    .select("*", { count: "exact", head: true })
    .eq("status", "overdue");

  const { count: openSupportTickets } = await supabase
    .from("student_support_tickets")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "in_review"]);

  const [{ count: totalSeats }, { count: occupiedSeats }, { count: pendingExits }, { count: pendingProofs }, { data: todayCollections }, { data: dailyTx }, { data: weeklyTx }, { data: monthlyTx }] = await Promise.all([
    supabase.from("seats").select("*", { count: "exact", head: true }),
    supabase.from("seats").select("*", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("exit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase
      .from("transactions")
      .select("amount")
      .eq("verification_status", "verified")
      .gte("verified_at", todayIso),
    supabase
      .from("transactions")
      .select("amount,type,payment_mode")
      .in("verification_status", ["verified", "closed"])
      .gte("verified_at", dailyWindow.startIso)
      .lt("verified_at", dailyWindow.endIso),
    supabase
      .from("transactions")
      .select("amount,type,payment_mode")
      .in("verification_status", ["verified", "closed"])
      .gte("verified_at", weeklyWindow.startIso)
      .lt("verified_at", weeklyWindow.endIso),
    supabase
      .from("transactions")
      .select("amount,type,payment_mode")
      .in("verification_status", ["verified", "closed"])
      .gte("verified_at", monthlyWindow.startIso)
      .lt("verified_at", monthlyWindow.endIso),
  ]);
  const occupancyPct = totalSeats ? Math.round(((occupiedSeats ?? 0) / totalSeats) * 100) : 0;
  const collectionToday = (todayCollections ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const dailyFinance = finalizeFinance(summarizeFinance(dailyTx));
  const weeklyFinance = finalizeFinance(summarizeFinance(weeklyTx));
  const monthlyFinance = finalizeFinance(summarizeFinance(monthlyTx));

  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Super Admin</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Bodhi Operations Center</h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">
          Monitor enquiries, students, seats, invoices, content, AI systems, and staff operations from one place.
        </p>
        <Link href="/super-admin/chatbot" className="mt-6 flex w-fit items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">
          <Bot className="h-5 w-5" />
          Access Bhanu AI Dashboard
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Enquiries" value={enquiryCount ?? 0} href="/super-admin/enquiries" />
        <MetricCard label="Active Students" value={studentCount ?? 0} href="/super-admin/students" />
        <MetricCard label="Available Seats" value={availableSeats ?? 0} href="/super-admin/seats" />
        <MetricCard label="Open Invoices" value={openBills ?? 0} href="/super-admin/billing" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Collections Today" value={`₹${collectionToday.toFixed(0)}`} href="/super-admin/billing" />
        <MetricCard label="Overdue Count" value={overdueBills ?? 0} href="/super-admin/billing" />
        <MetricCard label="Seat Occupancy" value={`${occupancyPct}%`} href="/super-admin/seats" />
        <MetricCard label="Exits Pending" value={pendingExits ?? 0} href="/super-admin/exit-requests" />
        <MetricCard label="Proof Queue" value={pendingProofs ?? 0} href="/super-admin/billing" />
        <MetricCard label="Open Support" value={openSupportTickets ?? 0} href="/super-admin/support" />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Today", summary: dailyFinance },
          { label: "This Week", summary: weeklyFinance },
          { label: "This Month", summary: monthlyFinance },
        ].map((item) => (
          <Link key={item.label} href={`/super-admin/billing?period=${item.label === "Today" ? "daily" : item.label === "This Week" ? "weekly" : "monthly"}`} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{item.label} Finance</p>
            <p className="mt-4 text-3xl font-black text-[#1b3022]">₹{item.summary.net.toFixed(0)}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">Revenue ₹{item.summary.revenue.toFixed(0)}</p>
            <p className="text-sm font-semibold text-[#7d2f2f]">Expense ₹{item.summary.expense.toFixed(0)}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Quick Navigation</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["/super-admin/enquiries", "Review enquiries"],
              ["/super-admin/students", "Manage students"],
              ["/super-admin/billing", "Verify payments"],
              ["/super-admin/content", "Publish posts"],
              ["/super-admin/chatbot", "Manage Bhanu AI"],
              ["/super-admin/support", "Review support"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[1.5rem] border border-[#dde4d9] bg-[#f5f8f3] px-5 py-4 text-sm font-bold text-[#1b3022]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Recent Notifications</p>
          <div className="mt-6 space-y-4">
            {(recentNotifications ?? []).length > 0 ? (
              recentNotifications?.map((notification) => (
                <div key={notification.id} className="rounded-[1.5rem] bg-[#f5f8f3] p-4">
                  <p className="font-black text-[#1b3022]">{notification.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#536352]">{notification.body}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-[#f5f8f3] p-4 text-sm font-medium text-[#536352]">
                Notifications will appear here as operations happen.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
