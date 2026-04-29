"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface SeatSummaryData {
  total: number;
  available: number;
  blocked: number;
  occupied: number;
}

export function SeatSummaryDisplay({ data: serverData }: { data: SeatSummaryData }) {
  return (
    <LocalStorageCache cacheKey="seats-summary" data={serverData}>
      {(data) => {
        const d = data || serverData || { total: 0, available: 0, blocked: 0, occupied: 0 };
        const stats = [
          { label: "Total", value: d.total },
          { label: "Available", value: d.available },
          { label: "Blocked", value: d.blocked },
          { label: "Occupied", value: d.occupied },
        ];

        return (
          <section className="grid gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6d7c6c]">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-[#1b3022]">{stat.value}</p>
              </div>
            ))}
          </section>
        );
      }}
    </LocalStorageCache>
  );
}
