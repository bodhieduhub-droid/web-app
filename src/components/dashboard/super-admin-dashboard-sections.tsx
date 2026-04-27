// Async sub-components for the Super-Admin Dashboard
// Each fetches independently so the page shell renders instantly.

import Link from "next/link";
import { finalizeFinance, getFinancePeriodWindow, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateToIST } from "@/lib/utils";
import { TrendChart } from "@/app/(dashboard)/super-admin/components/trend-chart";
import { RecentActivityLog, type ActivityLog } from "@/app/(dashboard)/super-admin/components/recent-activity-log";

// ─── Core Metric Cards ────────────────────────────────────────────────────────
export async function SuperAdminMetricCards() {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { count: enquiryCount },
    { count: studentCount },
    { count: availableSeats },
    { count: openBills },
    { count: overdueBills },
    { count: openSupportTickets },
    { count: totalSeats },
    { count: occupiedSeats },
    { count: pendingExits },
    { count: pendingProofs },
    { data: todayCollections },
  ] = await Promise.all([
    supabase.from("enquiries").select("*", { count: "exact", head: true }).in("status", ["new", "contacted", "seat_blocked"]),
    supabase.from("readers").select("*", { count: "exact", head: true }),
    supabase.from("seats").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("bills").select("*", { count: "exact", head: true }).in("status", ["pending", "proof_submitted", "partial", "rejected_proof", "overdue"]),
    supabase.from("bills").select("*", { count: "exact", head: true }).eq("status", "overdue"),
    supabase.from("student_support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_review"]),
    supabase.from("seats").select("*", { count: "exact", head: true }),
    supabase.from("seats").select("*", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("exit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("transactions").select("amount").eq("verification_status", "verified").gte("verified_at", todayIso),
  ]);

  const occupancyPct = totalSeats ? Math.round(((occupiedSeats ?? 0) / totalSeats) * 100) : 0;
  const collectionToday = (todayCollections ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  function MetricCard({ label, value, href }: { label: string; value: string | number; href: string }) {
    return (
      <Link href={href} className="premium-card relative group p-6 overflow-hidden flex flex-col justify-between min-h-[120px]">
        <div className="premium-card-inner"></div>
        
        {/* Subtle mesh/glow effect on hover */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[#1b3022]/0 to-[#1b3022]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]"></div>
        
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c] relative z-10">{label}</p>
        <p className="mt-4 text-4xl font-black text-[#1b3022] relative z-10 transition-transform duration-200 group-hover:scale-[1.02] origin-bottom-left">{value}</p>
      </Link>
    );
  }

  return (
    <>
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
    </>
  );
}

// ─── Finance Cards ────────────────────────────────────────────────────────────
export async function SuperAdminFinanceCards() {
  const supabase = createAdminClient();
  const dailyWindow = getFinancePeriodWindow("daily");
  const weeklyWindow = getFinancePeriodWindow("weekly");
  const monthlyWindow = getFinancePeriodWindow("monthly");

  const [{ data: dailyTx }, { data: weeklyTx }, { data: monthlyTx }] = await Promise.all([
    supabase.from("transactions").select("amount,type,payment_mode").in("verification_status", ["verified", "closed"]).gte("verified_at", dailyWindow.startIso).lt("verified_at", dailyWindow.endIso),
    supabase.from("transactions").select("amount,type,payment_mode").in("verification_status", ["verified", "closed"]).gte("verified_at", weeklyWindow.startIso).lt("verified_at", weeklyWindow.endIso),
    supabase.from("transactions").select("amount,type,payment_mode").in("verification_status", ["verified", "closed"]).gte("verified_at", monthlyWindow.startIso).lt("verified_at", monthlyWindow.endIso),
  ]);

  const dailyFinance = finalizeFinance(summarizeFinance(dailyTx));
  const weeklyFinance = finalizeFinance(summarizeFinance(weeklyTx));
  const monthlyFinance = finalizeFinance(summarizeFinance(monthlyTx));

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Today", summary: dailyFinance, period: "daily" },
        { label: "This Week", summary: weeklyFinance, period: "weekly" },
        { label: "This Month", summary: monthlyFinance, period: "monthly" },
      ].map((item) => (
        <Link key={item.label} href={`/super-admin/billing?period=${item.period}`} className="premium-card relative group p-6 overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="premium-card-inner"></div>
          <div className="absolute -inset-4 bg-gradient-to-br from-[#1b3022]/0 to-[#1b3022]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]"></div>
          
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c] relative z-10">{item.label} Finance</p>
          <div className="mt-4 relative z-10">
            <p className="text-3xl font-black text-[#1b3022] transition-transform duration-200 group-hover:translate-x-1">₹{item.summary.net.toFixed(0)}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">Revenue ₹{item.summary.revenue.toFixed(0)}</p>
            <p className="text-sm font-semibold text-[#7d2f2f]">Expense ₹{item.summary.expense.toFixed(0)}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

// ─── Analytics & Activity (SLOWEST) ──────────────────────────────────────────
export async function SuperAdminAnalytics() {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysIso = thirtyDaysAgo.toISOString();

  const [{ data: chartTx }, { data: recentEnquiries }, { data: recentStudents }, { data: recentBills }, { data: recentTx }] = await Promise.all([
    supabase.from("transactions").select("amount,verified_at").eq("verification_status", "verified").gte("verified_at", thirtyDaysIso).order("verified_at", { ascending: true }),
    supabase.from("enquiries").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("readers").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("bills").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("transactions").select("id, amount, submitted_at").order("submitted_at", { ascending: false }).limit(5),
  ]);

  // Build 30-day trend map
  const trendDataMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    trendDataMap.set(d.toISOString().split("T")[0], 0);
  }
  chartTx?.forEach((tx) => {
    if (tx.verified_at) {
      const istTime = new Date(new Date(tx.verified_at).getTime() + 5.5 * 60 * 60 * 1000);
      const dateKey = istTime.toISOString().split("T")[0];
      if (trendDataMap.has(dateKey)) trendDataMap.set(dateKey, trendDataMap.get(dateKey)! + Number(tx.amount || 0));
    }
  });
  const trendData = Array.from(trendDataMap.entries()).map(([date, revenue]) => ({ date, revenue }));

  const activities: ActivityLog[] = [
    ...(recentEnquiries || []).map((e) => ({ id: `enq-${e.id}`, type: "enquiry" as const, title: "New Enquiry", description: `${e.name} submitted an enquiry`, timestamp: e.created_at })),
    ...(recentStudents || []).map((s) => ({ id: `stu-${s.id}`, type: "student" as const, title: "New Admission", description: `${s.name} joined Bodhi Edu Hub`, timestamp: s.created_at })),
    ...(recentBills || []).map((b) => ({ id: `bill-${b.id}`, type: "invoice" as const, title: "Invoice Generated", description: b.title || "New invoice generated", timestamp: b.created_at })),
    ...(recentTx || []).map((t) => ({ id: `tx-${t.id}`, type: "payment" as const, title: "Payment Submitted", description: `A payment of ₹${t.amount} was submitted`, timestamp: t.submitted_at })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="premium-card relative overflow-hidden p-1">
        <div className="premium-card-inner"></div>
        <TrendChart data={trendData} />
      </div>
      <div className="premium-card relative overflow-hidden p-6">
        <div className="premium-card-inner"></div>
        <RecentActivityLog activities={activities} />
      </div>
    </section>
  );
}

// ─── Recent Notifications Panel ───────────────────────────────────────────────
export async function SuperAdminNotificationsPanel() {
  const supabase = createAdminClient();
  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="premium-card relative p-6">
      <div className="premium-card-inner"></div>
      <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c] relative z-10">Recent Notifications</p>
      <div className="mt-6 space-y-4 relative z-10">
        {(recentNotifications ?? []).length > 0 ? (
          recentNotifications?.map((n) => (
            <div key={n.id} className="rounded-[1.2rem] bg-[#f5f8f3] border border-[#e4eae0] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <p className="font-black text-[#1b3022]">{n.title}</p>
                <span className="ml-2 shrink-0 text-[10px] font-bold text-[#6d7c6c]">{formatDateToIST(n.created_at, "datetime")}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#536352]">{n.body}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.2rem] bg-[#f5f8f3] border border-[#e4eae0] p-4 text-sm font-medium text-[#536352]">
            Notifications will appear here as operations happen.
          </div>
        )}
      </div>
    </div>
  );
}
