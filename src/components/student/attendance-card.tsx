"use client";

import { MapPin, Wifi, CheckCircle2, Clock, Zap } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { checkInAction, checkOutAction } from "@/app/(dashboard)/attendance-actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { AttendanceRecord } from "@/lib/app-types";

interface AttendanceCardProps {
  todayAttendance: AttendanceRecord | null;
  streakCount: number;
}

export function AttendanceCard({ todayAttendance, streakCount }: AttendanceCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticAttendance, setOptimisticAttendance] = useOptimistic<AttendanceRecord | null, string>(
    todayAttendance,
    (state, newStatus) => {
      if (newStatus === "checking_in") {
        return { 
          id: "temp-id", 
          reader_id: "temp-reader", 
          date: new Date().toISOString().split("T")[0], 
          check_in_at: new Date().toISOString(),
          check_out_at: null,
          created_at: new Date().toISOString()
        } as AttendanceRecord;
      }
      if (newStatus === "checking_out") {
        return { ...state, check_out_at: new Date().toISOString() } as AttendanceRecord;
      }
      return state;
    }
  );

  const handleCheckIn = async (formData: FormData) => {
    startTransition(async () => {
      setOptimisticAttendance("checking_in");
      await checkInAction(formData);
    });
  };

  const handleCheckOut = async (formData: FormData) => {
    startTransition(async () => {
      setOptimisticAttendance("checking_out");
      await checkOutAction(formData);
    });
  };

  return (
    <div className={`rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5 transition-all hover:shadow-[#27452e]/8 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Daily Attendance</p>
          <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Reading Room Access</h2>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 rounded-full bg-[#f0f7ed] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1b3022]">
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
            {streakCount} Day Streak
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Status Section */}
        <div className={`flex flex-col justify-center rounded-3xl p-5 border ${optimisticAttendance ? 'bg-[#f7faf6] border-[#e1eadc]' : 'bg-[#fffbeb] border-[#fef3c7]'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${optimisticAttendance ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {optimisticAttendance ? <CheckCircle2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#6d7c6c]">Today's Status</p>
              <p className="text-lg font-black text-[#1b3022]">
                {optimisticAttendance ? (optimisticAttendance.check_out_at ? 'Session Ended' : 'Checked In') : 'Not Present Yet'}
              </p>
            </div>
          </div>
          
          {optimisticAttendance && (
            <div className="mt-4 space-y-2 border-t border-[#e1eadc] pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[#6d7c6c]">Entry:</span>
                <span className="font-black text-[#1b3022]">
                  {new Date(optimisticAttendance.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {optimisticAttendance.check_out_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#6d7c6c]">Exit:</span>
                  <span className="font-black text-[#1b3022]">
                    {new Date(optimisticAttendance.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="flex flex-col gap-3">
          {!optimisticAttendance ? (
            <form action={handleCheckIn} className="flex-1 flex flex-col">
              <p className="mb-3 text-xs font-medium leading-relaxed text-[#536352]">
                Mark your daily arrival. Please ensure you are connected to the <strong>Reading Room WiFi</strong>.
              </p>
              <PendingSubmitButton
                idleLabel="Check In Now"
                pendingLabel="Verifying..."
                className="mt-auto w-full rounded-2xl bg-[#1b3022] py-4 text-xs font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#1b3022]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              />
            </form>
          ) : !optimisticAttendance.check_out_at ? (
            <form action={handleCheckOut} className="flex-1 flex flex-col">
              <p className="mb-3 text-xs font-medium leading-relaxed text-[#536352]">
                Finished for the day? Remember to check out to keep your daily logs accurate.
              </p>
              <PendingSubmitButton
                idleLabel="Check Out"
                pendingLabel="Saving..."
                className="mt-auto w-full rounded-2xl border-2 border-[#1b3022] bg-transparent py-4 text-xs font-black uppercase tracking-[0.3em] text-[#1b3022] transition-all hover:bg-[#1b3022]/5 active:scale-[0.98]"
              />
            </form>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-[#f8faf7] p-5 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1b3022] shadow-sm">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-black text-[#1b3022]">Session Completed</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#6d7c6c]">See you tomorrow!</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#f7faf5] px-4 py-3 border border-[#e8efe5]">
        <Wifi className="h-3.5 w-3.5 text-[#1b3022]" />
        <p className="text-[10px] font-bold text-[#536352]">
          Attendance restricted to authorized Hub WiFi only.
        </p>
      </div>
    </div>
  );
}

