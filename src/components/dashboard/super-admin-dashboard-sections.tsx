// Async sub-components for the Super-Admin Dashboard
// Each fetches independently so the page shell renders instantly.

import Link from "next/link";
import { getFinancePeriodWindow } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateToIST } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { getISTStartOfDay } from "@/lib/date-utils";

import { MetricCardsDisplay } from "./metric-cards-display";
import { AnalyticsDisplay } from "./analytics-display";

// ─── Optimized Data Fetching (Cached) ────────────────────────────────────────

const getCachedMetrics = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_super_admin_metrics");
    if (error) {
      console.error("Error fetching metrics via RPC:", error);
      return null;
    }
    return data;
  },
  ["super-admin-metrics"],
  { revalidate: 60, tags: ["dashboard-metrics"] }
);

const getCachedFinance = unstable_cache(
  async (daily: any, weekly: any, monthly: any) => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_consolidated_finance_summary", {
      p_daily_start: daily.startIso,
      p_daily_end: daily.endIso,
      p_weekly_start: weekly.startIso,
      p_weekly_end: weekly.endIso,
      p_monthly_start: monthly.startIso,
      p_monthly_end: monthly.endIso,
    });
    if (error) {
      console.error("Error fetching finance via RPC:", error);
      return null;
    }
    return data;
  },
  ["super-admin-finance"],
  { revalidate: 300, tags: ["dashboard-finance"] }
);

// ─── Core Metric Cards ────────────────────────────────────────────────────────
export async function SuperAdminMetricCards() {
  const metrics = await getCachedMetrics();

  if (!metrics) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load metrics.</div>;
  }

  // Calculate occupancy locally (UI logic)
  const occupancyPct = metrics.totalSeats ? Math.round(((metrics.occupiedSeats ?? 0) / metrics.totalSeats) * 100) : 0;

  return <MetricCardsDisplay data={{ ...metrics, occupancyPct }} />;
}

// ─── Finance Cards ────────────────────────────────────────────────────────────
export async function SuperAdminFinanceCards() {
  const dailyWindow = getFinancePeriodWindow("daily");
  const weeklyWindow = getFinancePeriodWindow("weekly");
  const monthlyWindow = getFinancePeriodWindow("monthly");

  const summaries = await getCachedFinance(dailyWindow, weeklyWindow, monthlyWindow);

  if (!summaries) {
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load finance data.</div>;
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Today", summary: summaries.daily, period: "daily" },
        { label: "This Week", summary: summaries.weekly, period: "weekly" },
        { label: "This Month", summary: summaries.monthly, period: "monthly" },
      ].map((item) => (
        <Link key={item.label} href={`/super-admin/billing?period=${item.period}`} className="premium-card relative group p-6 overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="premium-card-inner"></div>
          <div className="absolute -inset-4 bg-gradient-to-br from-[#1b3022]/0 to-[#1b3022]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]"></div>
          
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c] relative z-10">{item.label} Finance</p>
          <div className="mt-4 relative z-10">
            <p className="text-3xl font-black text-[#1b3022] transition-transform duration-200 group-hover:translate-x-1">₹{Number(item.summary.net ?? 0).toFixed(0)}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">Revenue ₹{Number(item.summary.revenue ?? 0).toFixed(0)}</p>
            <p className="text-sm font-semibold text-[#7d2f2f]">Expense ₹{Number(item.summary.expense ?? 0).toFixed(0)}</p>
          </div>
        </Link>
      ))}
    </section>
  );
}

// ─── Analytics & Activity (SLOWEST) ──────────────────────────────────────────
export async function SuperAdminAnalytics() {
  const supabase = createAdminClient();

  // Fetch trend data via RPC and recent activities in parallel
  const [
    { data: trendDataRaw },
    { data: recentEnquiries },
    { data: recentStudents },
    { data: recentBills },
    { data: recentTx }
  ] = await Promise.all([
    supabase.rpc("get_revenue_trend_30d"),
    supabase.from("enquiries").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("readers").select("id, name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("bills").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("transactions").select("id, amount, submitted_at").order("submitted_at", { ascending: false }).limit(5),
  ]);

  // Format trend data for display
  const trendData = (trendDataRaw || []).map((row: any) => ({
    date: row.trend_date,
    revenue: Number(row.revenue)
  }));

  const activities = [
    ...(recentEnquiries || []).map((e) => ({ id: `enq-${e.id}`, type: "enquiry" as const, title: "New Enquiry", description: `${e.name} submitted an enquiry`, timestamp: e.created_at })),
    ...(recentStudents || []).map((s) => ({ id: `stu-${s.id}`, type: "student" as const, title: "New Admission", description: `${s.name} joined Bodhi Edu Hub`, timestamp: s.created_at })),
    ...(recentBills || []).map((b) => ({ id: `bill-${b.id}`, type: "invoice" as const, title: "Invoice Generated", description: b.title || "New invoice generated", timestamp: b.created_at })),
    ...(recentTx || []).map((t) => ({ id: `tx-${t.id}`, type: "payment" as const, title: "Payment Submitted", description: `A payment of ₹${t.amount} was submitted`, timestamp: t.submitted_at })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  return <AnalyticsDisplay data={{ trendData, activities }} />;
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
