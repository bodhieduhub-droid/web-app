"use client";

import Link from "next/link";
import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface StaffMetricData {
  enquiryCount: number;
  availableSeats: number;
  pendingProofs: number;
  collectionToday: number;
  overdueBills: number;
  occupancyPct: number;
  pendingExits: number;
  openSupportTickets: number;
}

export function StaffMetricCardsDisplay({ data: serverData }: { data: StaffMetricData }) {
  return (
    <LocalStorageCache cacheKey="staff-metrics" data={serverData}>
      {(data) => {
        const d = data || {
          enquiryCount: 0,
          availableSeats: 0,
          pendingProofs: 0,
          collectionToday: 0,
          overdueBills: 0,
          occupancyPct: 0,
          pendingExits: 0,
          openSupportTickets: 0,
        };

        const cards = [
          { label: "Open Enquiries", value: d.enquiryCount, href: "/staff/enquiries" },
          { label: "Available Seats", value: d.availableSeats, href: "/staff/seats" },
          { label: "Pending Proofs", value: d.pendingProofs, href: "/staff/billing" },
          { label: "Collections Today", value: `₹${Number(d.collectionToday).toFixed(0)}`, href: "/staff/billing" },
          { label: "Overdue Count", value: d.overdueBills, href: "/staff/billing" },
          { label: "Seat Occupancy", value: `${d.occupancyPct}%`, href: "/staff/seats" },
          { label: "Exits Pending", value: d.pendingExits, href: "/staff/exit-requests" },
          { label: "Open Support", value: d.openSupportTickets, href: "/staff/support" },
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
      }}
    </LocalStorageCache>
  );
}
