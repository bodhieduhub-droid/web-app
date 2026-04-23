import { Suspense } from "react";
import { StaffMetricCards, StaffFinanceCards } from "@/components/dashboard/staff-dashboard-sections";
import { CardsSkeleton, FinanceCardsSkeleton } from "@/components/dashboard/suspense-skeletons";

export const dynamic = "force-dynamic";

export default function StaffDashboard() {
  // No blocking data fetches here — everything is streamed via Suspense
  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT — zero data fetching) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Staff Dashboard</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Daily Operations</h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">
          Manage enquiries, seat blocking, student records, manual payment checks, and public/student content.
        </p>
      </section>

      {/* ── Metric Cards (SUSPENSE — loads independently) ── */}
      <Suspense fallback={<CardsSkeleton count={8} cols={4} />}>
        <StaffMetricCards />
      </Suspense>

      {/* ── Finance Cards (SUSPENSE — loads independently) ── */}
      <Suspense fallback={<FinanceCardsSkeleton />}>
        <StaffFinanceCards />
      </Suspense>
    </div>
  );
}
