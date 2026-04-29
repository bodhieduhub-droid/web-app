"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";

interface StaffSummaryData {
  totalCount: number;
  totalOpenAssignments: number;
  totalBlockedSeats: number;
  totalVerifications: number;
}

export function StaffSummaryDisplay({ data: serverData }: { data: StaffSummaryData }) {
  return (
    <LocalStorageCache cacheKey="staff-summary" data={serverData}>
      {(data) => {
        const d = data || serverData || { totalCount: 0, totalOpenAssignments: 0, totalBlockedSeats: 0, totalVerifications: 0 };
        return (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active Staff", value: d.totalCount },
              { label: "Open Enquiries Assigned", value: d.totalOpenAssignments },
              { label: "Blocked Seats", value: d.totalBlockedSeats },
              { label: "Payment Verifications", value: d.totalVerifications },
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
