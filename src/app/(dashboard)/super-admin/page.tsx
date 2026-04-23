import Link from "next/link";
import { Suspense } from "react";
import { Bot } from "lucide-react";
import {
  SuperAdminMetricCards,
  SuperAdminFinanceCards,
  SuperAdminAnalytics,
  SuperAdminNotificationsPanel,
} from "@/components/dashboard/super-admin-dashboard-sections";
import {
  CardsSkeleton,
  FinanceCardsSkeleton,
  ChartSkeleton,
  ActivitySkeleton,
  NotificationPanelSkeleton,
} from "@/components/dashboard/suspense-skeletons";

export const dynamic = "force-dynamic";

export default function SuperAdminDashboard() {
  // No blocking data fetches — everything streamed via Suspense
  return (
    <div className="space-y-8">
      {/* ── Hero (INSTANT) ── */}
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Super Admin</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Bodhi Operations Center</h1>
        <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">
          Monitor enquiries, students, seats, invoices, content, AI systems, and staff operations from one place.
        </p>
        <Link
          href="/super-admin/chatbot"
          className="mt-6 flex w-fit items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
        >
          <Bot className="h-5 w-5" />
          Access Bhanu AI Dashboard
        </Link>
      </section>

      {/* ── Core Metric Cards (SUSPENSE — streams independently) ── */}
      <Suspense fallback={
        <div className="space-y-4">
          <CardsSkeleton count={4} cols={4} />
          <CardsSkeleton count={6} cols={5} />
        </div>
      }>
        <SuperAdminMetricCards />
      </Suspense>

      {/* ── Finance Cards (SUSPENSE) ── */}
      <Suspense fallback={<FinanceCardsSkeleton />}>
        <SuperAdminFinanceCards />
      </Suspense>

      {/* ── Analytics + Activity Log (SLOWEST — isolated in its own Suspense) ── */}
      <Suspense fallback={
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ActivitySkeleton rows={6} />
        </div>
      }>
        <SuperAdminAnalytics />
      </Suspense>

      {/* ── Bottom Row: Quick Nav + Notifications ── */}
      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        {/* Quick Nav (INSTANT — no data needed) */}
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
                className="rounded-[1.5rem] border border-[#dde4d9] bg-[#f5f8f3] px-5 py-4 text-sm font-bold text-[#1b3022] hover:bg-[#eef2ec] transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Notifications (SUSPENSE) */}
        <Suspense fallback={<NotificationPanelSkeleton />}>
          <SuperAdminNotificationsPanel />
        </Suspense>
      </section>
    </div>
  );
}
