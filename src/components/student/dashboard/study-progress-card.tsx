import { createAdminClient } from "@/lib/supabase/admin";
import { Timer, Target, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { StudySessionRecord } from "@/lib/app-types";
import { getISTDateString } from "@/lib/date-utils";

export async function StudyProgressCard({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();
  const today = getISTDateString();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("reader_id", studentId)
    .gte("started_at", today)
    .order("started_at", { ascending: false });

  const rows = (sessions ?? []) as StudySessionRecord[];
  
  const todayMinutes = rows.reduce((sum, s) => sum + (s.focus_minutes * s.completed_focus_blocks), 0);
  const todayBlocks = rows.reduce((sum, s) => sum + s.completed_focus_blocks, 0);
  
  // Daily Goal (Hardcoded 4 hours for now, could be dynamic later)
  const DAILY_GOAL_MINUTES = 240; 
  const progressPercent = Math.min((todayMinutes / DAILY_GOAL_MINUTES) * 100, 100);
  
  const hours = Math.floor(todayMinutes / 60);
  const mins = todayMinutes % 60;

  return (
    <div className="relative overflow-hidden rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5 lg:p-8">
      {/* Decorative gradient background */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#f0f7ed] blur-3xl opacity-60" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Today's Progress</p>
            <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Study Milestone</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/20">
            <Timer className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Circular Progress (Simplified for now with text + bar) */}
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter text-[#1b3022]">
                {hours}h {mins}m
              </span>
              <span className="text-sm font-bold text-[#6d7c6c]">/ 4h goal</span>
            </div>
            
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#f0f7ed]">
              <div 
                className="h-full rounded-full bg-[#1b3022] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            <p className="mt-3 text-xs font-bold text-[#6d7c6c]">
              {progressPercent < 100 
                ? `You've completed ${Math.round(progressPercent)}% of your daily goal.`
                : "🎉 Daily study goal achieved! Keep pushing or take a well-deserved rest."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl bg-[#f7faf5] p-4 border border-[#e8efe5]">
              <div className="flex items-center gap-2 text-[#6d7c6c]">
                <Target className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Blocks</span>
              </div>
              <p className="mt-2 text-xl font-black text-[#1b3022]">{todayBlocks}</p>
              <p className="text-[9px] font-medium text-[#8a9d88]">Focused sessions</p>
            </div>
            <div className="rounded-3xl bg-[#f7faf5] p-4 border border-[#e8efe5]">
              <div className="flex items-center gap-2 text-[#6d7c6c]">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Effort</span>
              </div>
              <p className="mt-2 text-xl font-black text-[#1b3022]">{todayMinutes > 0 ? 'High' : 'Pending'}</p>
              <p className="text-[9px] font-medium text-[#8a9d88]">Relative intensity</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <Link 
            href="/student/study" 
            className="group flex items-center justify-between rounded-2xl bg-[#f0f7ed] px-5 py-4 transition-all hover:bg-[#1b3022] hover:text-white"
          >
            <span className="text-sm font-black uppercase tracking-widest">Resume Focus Session</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function StudyProgressSkeleton() {
  return (
    <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl lg:p-8">
      <div className="flex justify-between">
        <div className="space-y-3">
          <div className="h-2 w-20 animate-pulse rounded-full bg-[#e5ebe1]" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-[#e5ebe1]" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded-full bg-[#f0f4ec]" />
      </div>
      <div className="mt-8 h-3 w-full animate-pulse rounded-full bg-[#f0f4ec]" />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="h-16 animate-pulse rounded-2xl bg-[#f5f8f3]" />
        <div className="h-16 animate-pulse rounded-2xl bg-[#f5f8f3]" />
      </div>
    </div>
  );
}
