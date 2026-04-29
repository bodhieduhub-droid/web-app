"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface ExitRequestsSummaryData {
  pendingCount: number;
  processedCount: number;
  rejectedCount: number;
  refundEligibleCount: number;
}

export function ExitRequestsSummaryDisplay({ data: serverData }: { data: ExitRequestsSummaryData }) {
  return (
    <LocalStorageCache cacheKey="exit-requests-summary" data={serverData}>
      {(data) => {
        const d = data || serverData || { pendingCount: 0, processedCount: 0, rejectedCount: 0, refundEligibleCount: 0 };
        return (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Pending", value: d.pendingCount },
              { label: "Processed", value: d.processedCount },
              { label: "Rejected", value: d.rejectedCount },
              { label: "Refund Eligible", value: d.refundEligibleCount },
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
