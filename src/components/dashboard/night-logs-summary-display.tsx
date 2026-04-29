"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface NightLogsSummaryData {
  totalCount: number;
  activeCount: number;
  lateCount: number;
}

export function NightLogsSummaryDisplay({ data: serverData }: { data: NightLogsSummaryData }) {
  return (
    <LocalStorageCache cacheKey="night-logs-summary" data={serverData}>
      {(data) => {
        const d = data || serverData || { totalCount: 0, activeCount: 0, lateCount: 0 };
        return (
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Logs", value: d.totalCount },
              { label: "Active (Page)", value: d.activeCount },
              { label: "Late (Page)", value: d.lateCount },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-[#d8e0d4] bg-white p-4 shadow-lg shadow-[#27452e]/6">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-[#1b3022]">{item.value}</p>
              </div>
            ))}
          </section>
        );
      }}
    </LocalStorageCache>
  );
}
