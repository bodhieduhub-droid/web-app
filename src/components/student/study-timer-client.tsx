"use client";

import { Coffee, Maximize2, Target } from "lucide-react";
import { useStudyTimer } from "./hooks/use-study-timer";
import { type StudyInsights } from "./timer-parts/types";
import { TimerRing } from "./timer-parts/timer-ring";
import { TimerControls } from "./timer-parts/timer-controls";
import { TimerPresets } from "./timer-parts/timer-presets";
import { TimerProgressSummary } from "./timer-parts/timer-progress-summary";
import { FullscreenTimer } from "./timer-parts/fullscreen-timer";
import { TimerHistory } from "./timer-parts/timer-history";

export function StudyTimerClient({ insights }: { insights: StudyInsights }) {
  const t = useStudyTimer(insights);

  const handleToggle = () => {
    if (!t.running && t.phase === "work" && !t.sessionStartedAt) {
      t.setSessionStartedAt(new Date().toISOString());
    }
    t.setRunning((c) => !c);
  };

  /* Zen / fullscreen overlay — rendered on top when active */
  if (t.isFullscreen) {
    return (
      <FullscreenTimer
        phase={t.phase}
        progress={t.progress}
        secondsLeft={t.secondsLeft}
        running={t.running}
        sessions={t.sessions}
        onToggle={handleToggle}
        onReset={() => t.resetTimer(true)}
        onExit={t.toggleFullscreen}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-1.5 pb-10 sm:px-4 lg:px-8">
      <div className="flex flex-col gap-6">

        {/* ── Timer Card ── */}
        <div className="overflow-hidden rounded-[2rem] border border-[#dde8d8] bg-white shadow-xl shadow-[#1b3022]/5 sm:rounded-[2.5rem]">
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b border-[#eef4eb] px-4 py-3 sm:px-6 sm:py-4">
              {/* Phase pill */}
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-700 sm:px-4 sm:py-2 sm:text-[11px] ${
                  t.phase === "work" 
                    ? "bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/20" 
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {t.phase === "work" ? <Target className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                {t.phase === "work" ? "Focus Phase" : "Rest Phase"}
              </div>

              <div className="flex items-center gap-4">
                {/* Session dots */}
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full transition-all duration-500 ${
                          i < t.sessions ? "scale-110 bg-[#1b3022]" : "bg-[#d0dccb]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-black text-[#9aad98]">{t.sessions}/4</span>
                </div>

                <div className="hidden h-4 w-[1px] bg-[#eef4eb] sm:block" />

                {/* Zen */}
                <button
                  onClick={t.toggleFullscreen}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dde8d8] text-[#9aad98] outline-none transition hover:border-[#1b3022] hover:bg-[#f0f6ed] hover:text-[#1b3022] active:scale-95"
                  title="Zen Mode"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {/* LEFT: Timer Section */}
            <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-16">
              <TimerRing phase={t.phase} progress={t.progress} secondsLeft={t.secondsLeft} running={t.running} />
              <div className="mt-6 flex flex-col items-center gap-1 text-center">
                <p className="text-xs font-black text-[#1b3022]">
                  {t.sessions === 0
                    ? "Ready for your first session?"
                    : `${t.sessions} of 4 sessions complete`}
                </p>
                <p className="text-[10px] font-bold text-[#9aad98]">
                  {t.phase === "work" ? "Stay focused, you got this!" : "Time to recharge your energy."}
                </p>
              </div>

              {/* Mobile/Tablet Controls (Visible only on < lg) */}
              <div className="mt-8 w-full max-w-sm lg:hidden">
                <TimerControls
                  running={t.running}
                  onToggle={handleToggle}
                  onReset={() => t.resetTimer(true)}
                />
                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-[#eef4eb]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9aad98]">Presets</span>
                    <div className="h-[1px] flex-1 bg-[#eef4eb]" />
                  </div>
                  <TimerPresets
                    activeId={t.presetId}
                    running={t.running}
                    customWorkMinutes={t.customWorkMinutes}
                    customRestMinutes={t.customRestMinutes}
                    onPresetChange={t.handlePresetChange}
                    onCustomMinutesChange={t.handleCustomMinutesChange}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Desktop Controls & Presets (Visible only on lg) */}
            <div className="hidden lg:flex w-[340px] flex-col border-l border-[#eef4eb] bg-[#fcfdfb] p-6 xl:p-10 justify-center gap-10">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9aad98]">Quick Actions</p>
                  <TimerControls
                    running={t.running}
                    onToggle={handleToggle}
                    onReset={() => t.resetTimer(true)}
                  />
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9aad98]">Study Presets</span>
                    <div className="h-[1px] flex-1 bg-[#eef4eb]" />
                  </div>
                  <TimerPresets
                    activeId={t.presetId}
                    running={t.running}
                    customWorkMinutes={t.customWorkMinutes}
                    customRestMinutes={t.customRestMinutes}
                    onPresetChange={t.handlePresetChange}
                    onCustomMinutesChange={t.handleCustomMinutesChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Secondary Stats Grid ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TimerProgressSummary insights={{ ...insights, todayBlocks: t.sessions }} />
          
          <TimerHistory sessions={insights.recentSessions} />
        </div>

      </div>
    </div>
  );
}
