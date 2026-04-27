import { getISTHour } from "@/lib/date-utils";
import { Zap, MapPin, Trophy } from "lucide-react";

interface StudentHeroProps {
  studentName: string;
  seatNumber?: string | null;
  streakCount?: number;
}

export function StudentHero({ studentName, seatNumber, streakCount = 0 }: StudentHeroProps) {
  const hour = getISTHour();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";

  return (
    <section className="relative overflow-hidden rounded-[2.8rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/20 lg:p-12">
      {/* Dynamic background lighting */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#345b41]/40 blur-[120px]" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
      
      <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-white/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Student Portal</p>
          </div>
          <h1 className="mt-6 text-5xl font-black uppercase tracking-tighter lg:text-7xl">
            {greeting},
          </h1>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white/60 lg:text-4xl">
            {studentName}
          </h2>
          
          <div className="mt-10 flex flex-wrap gap-4">
            {seatNumber ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-md border border-white/5">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none">Your Seat</p>
                  <p className="mt-1 text-sm font-black text-white">{seatNumber}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 px-5 py-3 backdrop-blur-md border border-amber-500/20">
                <MapPin className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400/60 leading-none">Status</p>
                  <p className="mt-1 text-sm font-black text-amber-400">Floating Seat</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-md border border-white/5">
              <Zap className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 leading-none">Consistency</p>
                <p className="mt-1 text-sm font-black text-white">{streakCount} Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[2.4rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Daily Motivation</p>
                <p className="mt-1 text-lg font-bold italic text-white/90 leading-tight">
                  "Success is the sum of small efforts, repeated day in and day out."
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Secure & Online</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
