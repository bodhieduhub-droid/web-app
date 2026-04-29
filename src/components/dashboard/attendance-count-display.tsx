"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";

export function AttendanceCountDisplay({ count, targetDate }: { count: number; targetDate: string }) {
  return (
    <LocalStorageCache cacheKey={`attendance-count-${targetDate}`} data={count}>
      {(data) => (
        <div className="rounded-2xl bg-white px-6 py-2 border border-[#d8e0d4] shadow-sm shrink-0">
           <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7c6c]">Total Present</p>
           <p className="text-xl font-black text-[#1b3022]">{data ?? count ?? 0}</p>
        </div>
      )}
    </LocalStorageCache>
  );
}
