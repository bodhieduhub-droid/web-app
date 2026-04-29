"use client";

import { LocalStorageCache } from "@/components/ui/local-storage-cache";
import { Zap, MapPin } from "lucide-react";

export function StudentHeroDisplay({ 
  studentName, 
  seatNumber, 
  streakCount 
}: { 
  studentName: string; 
  seatNumber?: number | null; 
  streakCount: number 
}) {
  return (
    <LocalStorageCache 
      cacheKey={`student-hero-${studentName}`} 
      data={{ studentName, seatNumber, streakCount }}
    >
      {(data) => {
        const d = data || { studentName, seatNumber, streakCount };
        return (
          <section className="relative overflow-hidden rounded-[2.8rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/20 sm:p-10">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 translate-y--1/4 rounded-full bg-white/5 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-md border border-white/5">
                    Student Dashboard
                  </span>
                  {d.seatNumber && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/20">
                      <MapPin className="h-3 w-3" /> Seat #{d.seatNumber}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Welcome back, <br/>
                  <span className="text-emerald-400">{d.studentName}</span>
                </h1>
              </div>

              <div className="flex items-center gap-6 rounded-3xl bg-white/5 p-6 backdrop-blur-xl border border-white/10">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Zap className="h-8 w-8 text-[#1b3022] fill-[#1b3022]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Current Streak</p>
                  <p className="text-3xl font-black text-white">{d.streakCount} Days</p>
                </div>
              </div>
            </div>
          </section>
        );
      }}
    </LocalStorageCache>
  );
}
