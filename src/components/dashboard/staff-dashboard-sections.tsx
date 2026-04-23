// Async sub-components for the Staff Dashboard
// Each fetches its own data independently so the page shell renders instantly.

import Link from "next/link";
import { finalizeFinance, getFinancePeriodWindow, summarizeFinance } from "@/lib/finance-utils";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Quick Stats Cards ────────────────────────────────────────────────────────
export async function StaffMetricCards() {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [
    { count: enquiryCount },
    { count: availableSeats },
    { count: pendingProofs },
    { count: openSupportTickets },
    { count: totalSeats },
    { count: occupiedSeats },
    { count: pendingExits },
    { count: overdueBills },
    { data: todayCollections },
  ] = await Promise.all([
    supabase.from("enquiries").select("*", { count: "exact", head: true }).in("status", ["new", "contacted", "seat_blocked"]),
    supabase.from("seats").select("*", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase.from("student_support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_review"]),
    supabase.from("seats").select("*", { count: "exact", head: true }),
    supabase.from("seats").select("*", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("exit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bills").select("*", { count: "exact", head: true }).eq("status", "overdue"),
    supabase.from("transactions").select("amount").eq("verification_status", "verified").gte("verified_at", todayIso),
  ]);

  const occupancyPct = totalSeats ? Math.round(((occupiedSeats ?? 0) / totalSeats) * 100) : 0;
  const collectionToday = (todayCollections ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const cards = [
    { label: "Open Enquiries", value: enquiryCount ?? 0, href: "/staff/enquiries" },
    { label: "Available Seats", value: availableSeats ?? 0, href: "/staff/seats" },
    { label: "Pending Proofs", value: pendingProofs ?? 0, href: "/staff/billing" },
    { label: "Collections Today", value: `₹${collectionToday.toFixed(0)}`, href: "/staff/billing" },
    { label: "Overdue Count", value: overdueBills ?? 0, href: "/staff/billing" },
    { label: "Seat Occupancy", value: `${occupancyPct}%`, href: "/staff/seats" },
    { label: "Exits Pending", value: pendingExits ?? 0, href: "/staff/exit-requests" },
    { label: "Open Support", value: openSupportTickets ?? 0, href: "/staff/support" },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 hover:bg-[#f9fbf8] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{card.label}</p>
          <p className="mt-4 text-4xl font-black text-[#1b3022]">{card.value}</p>
        </Link>
      ))}
    </section>
  );
}

// ─── Finance Summary Cards ────────────────────────────────────────────────────
export async function StaffFinanceCards() {
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
        <Link key={item.label} href={`/staff/billing?period=${item.period}`} className="rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 hover:bg-[#f9fbf8] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">{item.label} Finance</p>
          <p className="mt-4 text-3xl font-black text-[#1b3022]">₹{item.summary.net.toFixed(0)}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">Revenue ₹{item.summary.revenue.toFixed(0)}</p>
          <p className="text-sm font-semibold text-[#7d2f2f]">Expense ₹{item.summary.expense.toFixed(0)}</p>
        </Link>
      ))}
    </section>
  );
}
