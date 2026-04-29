"use client";

import Link from "next/link";
import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface MetricData {
  enquiryCount: number;
  studentCount: number;
  availableSeats: number;
  openBills: number;
  collectionToday: number;
  overdueBills: number;
  occupancyPct: number;
  pendingExits: number;
  pendingProofs: number;
  openSupportTickets: number;
}

function MetricCard({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="premium-card relative group p-6 overflow-hidden flex flex-col justify-between min-h-[120px]">
      <div className="premium-card-inner"></div>
      <div className="absolute -inset-4 bg-gradient-to-br from-[#1b3022]/0 to-[#1b3022]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[2rem]"></div>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c] relative z-10">{label}</p>
      <p className="mt-4 text-4xl font-black text-[#1b3022] relative z-10 transition-transform duration-200 group-hover:scale-[1.02] origin-bottom-left">{value}</p>
    </Link>
  );
}

export function MetricCardsDisplay({ data: serverData }: { data: MetricData }) {
  return (
    <LocalStorageCache cacheKey="super-admin-metrics" data={serverData}>
      {(data) => {
        const d = data || {
          enquiryCount: 0,
          studentCount: 0,
          availableSeats: 0,
          openBills: 0,
          collectionToday: 0,
          overdueBills: 0,
          occupancyPct: 0,
          pendingExits: 0,
          pendingProofs: 0,
          openSupportTickets: 0,
        };

        return (
          <div className="space-y-4">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Open Enquiries" value={d.enquiryCount} href="/super-admin/enquiries" />
              <MetricCard label="Active Students" value={d.studentCount} href="/super-admin/students" />
              <MetricCard label="Available Seats" value={d.availableSeats} href="/super-admin/seats" />
              <MetricCard label="Open Invoices" value={d.openBills} href="/super-admin/billing" />
            </section>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard label="Collections Today" value={`₹${Number(d.collectionToday).toFixed(0)}`} href="/super-admin/billing" />
              <MetricCard label="Overdue Count" value={d.overdueBills} href="/super-admin/billing" />
              <MetricCard label="Seat Occupancy" value={`${d.occupancyPct}%`} href="/super-admin/seats" />
              <MetricCard label="Exits Pending" value={d.pendingExits} href="/super-admin/exit-requests" />
              <MetricCard label="Proof Queue" value={d.pendingProofs} href="/super-admin/billing" />
            </section>
          </div>
        );
      }}
    </LocalStorageCache>
  );
}
