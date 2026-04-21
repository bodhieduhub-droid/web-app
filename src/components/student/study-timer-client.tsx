"use client";

import { Coffee, Target } from "lucide-react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { logStudySessionAction } from "@/app/(dashboard)/actions";
import type { StudySessionRecord } from "@/lib/app-types";

type PresetId = "pomodoro" | "long-focus" | "quick-sprint" | "custom";

type StudyInsights = {
  todayMinutes: number;
  todayBlocks: number;
  weekMinutes: number;
  streakDays: number;
  totalBlocks: number;
  recentSessions: StudySessionRecord[];
  weeklyChartData?: { dayLabel: string; minutes: number }[];
};

const PRESETS: Array<{ id: Exclude<PresetId, "custom">; label: string; work: number; rest: number }> = [
  { id: "pomodoro", label: "Pomodoro", work: 25, rest: 5 },
  { id: "long-focus", label: "Long Focus", work: 50, rest: 10 },
  { id: "quick-sprint", label: "Quick Sprint", work: 15, rest: 3 },
];

const PRESET_LABEL_TO_ID: Record<string, PresetId> = {
  Pomodoro: "pomodoro",
  "Long Focus": "long-focus",
  "Quick Sprint": "quick-sprint",
  Custom: "custom",
};

const EXAM_QUOTES: Record<string, string[]> = {
  UPSC: [
    "Every page you read today is a step closer to your IAS dream.",
    "UPSC is not just an exam - it's a transformation of character.",
    "Consistency beats talent when talent doesn't study consistently.",
  ],
  SSC: [
    "One more mock test, one rank higher.",
    "The question paper doesn't care about your mood. Study anyway.",
    "SSC CGL toppers were once beginners too.",
  ],
  PSC: [
    "Your state needs good officers. Be one.",
    "Daily revision compounds into exam-day confidence.",
    "Small daily improvements lead to stunning long-term results.",
  ],
  BANKING: [
    "Speed and accuracy are the twin pillars of banking exams.",
    "Every arithmetic problem you solve is money in the bank.",
    "Aptitude is trainable. Train hard.",
  ],
  RAILWAY: [
    "Railways connects the nation. Let your success connect your future.",
    "Technical knowledge plus speed builds railway success.",
    "Every practice test moves you down the track to selection.",
  ],
  DEFAULT: [
    "Focus is the new IQ.",
    "Your future self is watching you right now. Make them proud.",
    "Study with the same intensity you pray with.",
  ],
};

const TIMER_STORAGE_KEY = "bodhi-study-timer-state-v1";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function clampMinutes(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getPresetConfig(presetId: PresetId, customWorkMinutes: number, customRestMinutes: number) {
  if (presetId === "custom") {
    return {
      id: "custom" as const,
      label: "Custom",
      work: clampMinutes(customWorkMinutes, 1, 180),
      rest: clampMinutes(customRestMinutes, 1, 60),
    };
  }

  return PRESETS.find((preset) => preset.id === presetId) ?? PRESETS[0];
}

function buildSessionFormData(input: {
  presetName: string;
  focusMinutes: number;
  breakMinutes: number;
  completedFocusBlocks: number;
  startedAt: string;
  endedAt?: string | null;
}) {
  const formData = new FormData();
  formData.set("preset_name", input.presetName);
  formData.set("focus_minutes", String(input.focusMinutes));
  formData.set("break_minutes", String(input.breakMinutes));
  formData.set("completed_focus_blocks", String(input.completedFocusBlocks));
  formData.set("started_at", input.startedAt);
  if (input.endedAt) formData.set("ended_at", input.endedAt);
  formData.set("source", "portal_timer");
  return formData;
}

export function StudyTimerClient({ insights }: { insights: StudyInsights }) {
  const [presetId, setPresetId] = useState<PresetId>("pomodoro");
  const [customWorkMinutes, setCustomWorkMinutes] = useState(40);
  const [customRestMinutes, setCustomRestMinutes] = useState(10);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(insights.todayBlocks);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [examCategory, setExamCategory] = useState<string>("DEFAULT");
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydratedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const preset = getPresetConfig(presetId, customWorkMinutes, customRestMinutes);
  const quotes = EXAM_QUOTES[examCategory] ?? EXAM_QUOTES.DEFAULT;
  const totalPhaseSeconds = (phase === "work" ? preset.work : preset.rest) * 60;
  const progress = 1 - secondsLeft / totalPhaseSeconds;
  const circumference = 2 * Math.PI * 110;

  const persistStudySession = useCallback((input: {
    completedFocusBlocks: number;
    startedAt: string;
    endedAt?: string | null;
  }) => {
    const formData = buildSessionFormData({
      presetName: preset.label,
      focusMinutes: preset.work,
      breakMinutes: preset.rest,
      completedFocusBlocks: input.completedFocusBlocks,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
    });

    startTransition(async () => {
      await logStudySessionAction(formData);
    });
  }, [preset.label, preset.rest, preset.work]);

  const finishWorkSession = useCallback((completedFocusBlocks: number) => {
    if (!sessionStartedAt) return;
    persistStudySession({
      completedFocusBlocks,
      startedAt: sessionStartedAt,
      endedAt: new Date().toISOString(),
    });
    setSessionStartedAt(null);
  }, [persistStudySession, sessionStartedAt]);

  function resetTimer(logPartial = false) {
    if (logPartial && running && phase === "work" && sessionStartedAt) {
      finishWorkSession(0);
    }

    setRunning(false);
    setPhase("work");
    setSecondsLeft(preset.work * 60);
    if (!logPartial) {
      setSessionStartedAt(null);
    }
  }

  function handlePresetChange(nextPresetId: PresetId) {
    if (running && phase === "work" && sessionStartedAt) {
      finishWorkSession(0);
    }

    const nextPreset = getPresetConfig(nextPresetId, customWorkMinutes, customRestMinutes);
    setPresetId(nextPresetId);
    setRunning(false);
    setPhase("work");
    setSecondsLeft(nextPreset.work * 60);
    setSessionStartedAt(null);
  }

  function handleCustomMinutesChange(kind: "work" | "rest", rawValue: string) {
    const nextValue = clampMinutes(Number(rawValue) || (kind === "work" ? customWorkMinutes : customRestMinutes), 1, kind === "work" ? 180 : 60);
    if (kind === "work") {
      setCustomWorkMinutes(nextValue);
      if (presetId === "custom" && !running) {
        setPhase("work");
        setSecondsLeft(nextValue * 60);
      }
      return;
    }

    setCustomRestMinutes(nextValue);
    if (presetId === "custom" && !running) {
      setPhase("work");
      setSecondsLeft(customWorkMinutes * 60);
    }
  }

  async function toggleFullscreen() {
    if (!rootRef.current || typeof document === "undefined") return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await rootRef.current.requestFullscreen();
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (typeof document === "undefined") return;
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as {
          presetId?: PresetId;
          presetLabel?: string;
          customWorkMinutes?: number;
          customRestMinutes?: number;
          phase?: "work" | "rest";
          secondsLeft?: number;
          running?: boolean;
          sessions?: number;
          quoteIndex?: number;
          examCategory?: string;
          savedAt?: string;
          sessionStartedAt?: string | null;
        };

        const nextPresetId = parsed.presetId ?? PRESET_LABEL_TO_ID[parsed.presetLabel ?? "Pomodoro"] ?? "pomodoro";
        const nextCustomWork = clampMinutes(Number(parsed.customWorkMinutes) || 40, 1, 180);
        const nextCustomRest = clampMinutes(Number(parsed.customRestMinutes) || 10, 1, 60);
        const nextPreset = getPresetConfig(nextPresetId, nextCustomWork, nextCustomRest);
        const nextPhase = parsed.phase === "rest" ? "rest" : "work";
        let nextSecondsLeft = Number.isFinite(parsed.secondsLeft)
          ? Math.max(1, Number(parsed.secondsLeft))
          : (nextPhase === "work" ? nextPreset.work : nextPreset.rest) * 60;
        let nextRunning = parsed.running === true;
        let nextSessions = Number.isFinite(parsed.sessions)
          ? Math.max(insights.todayBlocks, Number(parsed.sessions))
          : insights.todayBlocks;
        const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : Date.now();
        const elapsed = nextRunning ? Math.floor((Date.now() - savedAt) / 1000) : 0;
        let currentPhase: "work" | "rest" = nextPhase;

        if (parsed.savedAt) {
          const savedDate = new Date(parsed.savedAt);
          const now = new Date();
          const isSameDay =
            savedDate.getFullYear() === now.getFullYear() &&
            savedDate.getMonth() === now.getMonth() &&
            savedDate.getDate() === now.getDate();
          if (!isSameDay) {
            nextSessions = insights.todayBlocks;
          }
        }

        if (nextRunning && elapsed > 0) {
          if (elapsed >= nextSecondsLeft) {
            nextRunning = false;
            if (currentPhase === "work") {
              nextSessions += 1;
              currentPhase = "rest";
              nextSecondsLeft = nextPreset.rest * 60;
            } else {
              currentPhase = "work";
              nextSecondsLeft = nextPreset.work * 60;
            }
          } else {
            nextSecondsLeft -= elapsed;
          }
        }

        setPresetId(nextPresetId);
        setCustomWorkMinutes(nextCustomWork);
        setCustomRestMinutes(nextCustomRest);
        setPhase(currentPhase);
        setSecondsLeft(nextSecondsLeft);
        setRunning(nextRunning);
        setSessions(nextSessions);
        setQuoteIndex(Number.isFinite(parsed.quoteIndex) ? Number(parsed.quoteIndex) : 0);
        setExamCategory(parsed.examCategory || "DEFAULT");
        setSessionStartedAt(nextRunning && currentPhase === "work" ? parsed.sessionStartedAt ?? null : null);
      } catch {
        window.localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [insights.todayBlocks]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        presetId,
        presetLabel: preset.label,
        customWorkMinutes,
        customRestMinutes,
        phase,
        secondsLeft,
        running,
        sessions,
        quoteIndex,
        examCategory,
        savedAt: new Date().toISOString(),
        sessionStartedAt,
      }),
    );
  }, [customRestMinutes, customWorkMinutes, examCategory, phase, preset.label, presetId, quoteIndex, running, secondsLeft, sessionStartedAt, sessions]);

  useEffect(() => {
    function completePhase() {
      setRunning(false);
      setQuoteIndex((index) => (index + 1) % quotes.length);

      if (phase === "work") {
        finishWorkSession(1);
        setSessions((value) => value + 1);
        setPhase("rest");
        setSecondsLeft(preset.rest * 60);
        return;
      }

      setPhase("work");
      setSecondsLeft(preset.work * 60);
      setSessionStartedAt(null);
    }

    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            completePhase();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [finishWorkSession, phase, preset.rest, preset.work, quotes.length, running]);

  return (
    <div ref={rootRef} className={isFullscreen ? "min-h-screen bg-[#eef3ea] px-6 py-8" : "space-y-8"}>
      {isFullscreen ? (
        <section className="flex items-center justify-between gap-4 rounded-[2rem] bg-[#1b3022] px-6 py-5 text-white shadow-2xl shadow-[#1b3022]/15">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Fullscreen Focus</p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-tight">Stay With The Block</h1>
          </div>
          <button
            onClick={toggleFullscreen}
            className="rounded-2xl border border-white/20 px-5 py-3 text-[11px] font-black uppercase tracking-[0.28em] text-white"
          >
            Exit Fullscreen
          </button>
        </section>
      ) : (
        <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Study Timer</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Focus Mode</h1>
          <p className="mt-4 text-base font-medium leading-7 text-white/80">
            Use the Pomodoro technique to maximize deep work. Study hard, rest smart.
          </p>
        </section>
      )}

      <div className={`grid gap-6 ${isFullscreen ? "xl:grid-cols-[1.25fr_0.75fr]" : "lg:grid-cols-[1fr_380px]"}`}>
        <div className={`flex flex-col items-center rounded-[2rem] border border-[#d8e0d4] bg-white p-8 shadow-xl shadow-[#27452e]/8 ${isFullscreen ? "justify-center" : ""}`}>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] ${phase === "work" ? "bg-[#1b3022] text-white" : "bg-emerald-100 text-emerald-800"}`}>
            {phase === "work" ? <Target className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
            {phase === "work" ? "Focus" : "Rest"}
          </span>

          <div className="relative mt-8 flex items-center justify-center">
            <svg viewBox="0 0 240 240" className={`${isFullscreen ? "h-72 w-72" : "h-56 w-56"} -rotate-90`}>
              <circle cx="120" cy="120" r="110" fill="none" stroke="#eef3ea" strokeWidth="12" />
              <circle
                cx="120"
                cy="120"
                r="110"
                fill="none"
                stroke={phase === "work" ? "#1b3022" : "#34d399"}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <p className={`${isFullscreen ? "text-6xl" : "text-5xl"} font-black tabular-nums text-[#1b3022]`}>{formatTime(secondsLeft)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8a9d88]">
                {phase === "work" ? "minutes left" : "rest time"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                if (!running && phase === "work" && !sessionStartedAt) {
                  setSessionStartedAt(new Date().toISOString());
                }
                setRunning((current) => !current);
              }}
              className="rounded-2xl bg-[#1b3022] px-8 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#1b3022]/25 transition hover:bg-[#27452e]"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => resetTimer(true)}
              className="rounded-2xl border border-[#d8e0d4] px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#536352] transition hover:bg-[#f3f7f0]"
            >
              Reset
            </button>
            <button
              onClick={toggleFullscreen}
              className="rounded-2xl border border-[#d8e0d4] px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#536352] transition hover:bg-[#f3f7f0]"
            >
              {isFullscreen ? "Leave Focus" : "Fullscreen"}
            </button>
          </div>

          <div className="mt-8 flex items-center gap-2">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, index) => (
              <div key={index} className={`h-3 w-3 rounded-full ${index < sessions ? "bg-[#1b3022]" : "bg-[#eef3ea]"}`} />
            ))}
            <p className="ml-2 text-xs font-bold text-[#8a9d88]">{sessions} session{sessions !== 1 ? "s" : ""} today</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Timer Preset</p>
            <div className="mt-4 space-y-2">
              {PRESETS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handlePresetChange(item.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${presetId === item.id ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] text-[#1b3022] hover:bg-[#f3f7f0]"}`}
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`text-xs font-medium ${presetId === item.id ? "text-white/70" : "text-[#8a9d88]"}`}>
                    {item.work} min work · {item.rest} min rest
                  </p>
                </button>
              ))}
              <button
                onClick={() => handlePresetChange("custom")}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${presetId === "custom" ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] text-[#1b3022] hover:bg-[#f3f7f0]"}`}
              >
                <p className="text-sm font-black">Custom</p>
                <p className={`text-xs font-medium ${presetId === "custom" ? "text-white/70" : "text-[#8a9d88]"}`}>
                  {customWorkMinutes} min work · {customRestMinutes} min rest
                </p>
              </button>
            </div>

            {presetId === "custom" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Focus Minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    disabled={running}
                    value={customWorkMinutes}
                    onChange={(event) => handleCustomMinutesChange("work", event.target.value)}
                    className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] disabled:opacity-60"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Break Minutes</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    disabled={running}
                    value={customRestMinutes}
                    onChange={(event) => handleCustomMinutesChange("rest", event.target.value)}
                    className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] disabled:opacity-60"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Focus History</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f5f8f3] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">Today</p>
                <p className="mt-2 text-2xl font-black text-[#1b3022]">{insights.todayMinutes}m</p>
              </div>
              <div className="rounded-2xl bg-[#f5f8f3] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">This Week</p>
                <p className="mt-2 text-2xl font-black text-[#1b3022]">{insights.weekMinutes}m</p>
              </div>
              <div className="rounded-2xl bg-[#f5f8f3] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">Streak</p>
                <p className="mt-2 text-2xl font-black text-[#1b3022]">{insights.streakDays} day{insights.streakDays !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {insights.weeklyChartData && (
              <div className="mt-4 rounded-2xl bg-[#fafdf8] p-4 border border-[#e4eae0]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">7-Day Analytics</p>
                <div className="mt-6 flex h-32 items-end gap-1.5 px-2">
                  {insights.weeklyChartData.map((day, i) => {
                    const maxMinutes = Math.max(...insights.weeklyChartData!.map(d => d.minutes), 120);
                    const heightPercent = Math.min((day.minutes / maxMinutes) * 100, 100);
                    return (
                      <div key={i} className="group relative flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-md bg-[#2f4d36] transition-opacity hover:opacity-80" style={{ height: `${heightPercent}%`, minHeight: day.minutes > 0 ? "4px" : "0" }}></div>
                        <span className="text-[9px] font-bold uppercase text-[#8a9d88]">{day.dayLabel}</span>
                        {/* Tooltip */}
                        <div className="absolute -top-8 hidden rounded bg-[#1b3022] px-2 py-1 text-xs font-bold text-white group-hover:block z-10 whitespace-nowrap">
                          {day.minutes}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-[#fafdf8] p-4 border border-[#e4eae0]">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">Achievements</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className={`rounded-full px-3 py-1 text-xs font-bold ${insights.streakDays >= 3 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-gray-100/50 text-gray-400 grayscale opacity-50"}`}>🔥 3-Day Streak</div>
                <div className={`rounded-full px-3 py-1 text-xs font-bold ${insights.todayMinutes >= 120 ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-gray-100/50 text-gray-400 grayscale opacity-50"}`}>🧠 Deep Worker (2h+)</div>
                <div className={`rounded-full px-3 py-1 text-xs font-bold ${insights.weekMinutes >= 600 ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-100/50 text-gray-400 grayscale opacity-50"}`}>📚 Scholar (10h/wk)</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#fafdf8] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a9d88]">Recent Sessions</p>
              <div className="mt-3 space-y-2">
                {insights.recentSessions.length > 0 ? (
                  insights.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-black text-[#1b3022]">{session.preset_name}</p>
                        <p className="mt-1 text-xs font-medium text-[#536352]">
                          {session.focus_minutes}m focus · {session.break_minutes}m break · {session.completed_focus_blocks} block{session.completed_focus_blocks !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a9d88]">
                        {new Date(session.started_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-[#536352]">Complete a focus block to start your study history.</p>
                )}
              </div>
            </div>
          </div>

          {!isFullscreen ? (
            <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Your Exam</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["DEFAULT", "UPSC", "SSC", "PSC", "BANKING", "RAILWAY"].map((category) => (
                  <button
                    key={category}
                    onClick={() => setExamCategory(category)}
                    className={`rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${examCategory === category ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] text-[#536352] hover:border-[#1b3022]/40"}`}
                  >
                    {category === "DEFAULT" ? "General" : category}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!isFullscreen ? (
            <div className="rounded-[2rem] border border-[#d8e0d4] bg-[#fafdf8] p-6 shadow-lg shadow-[#27452e]/6">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Today&apos;s Thought</p>
              <p className="mt-4 text-base font-bold italic leading-7 text-[#1b3022]">
                &ldquo;{quotes[quoteIndex % quotes.length]}&rdquo;
              </p>
              <button
                onClick={() => setQuoteIndex((value) => (value + 1) % quotes.length)}
                className="mt-4 text-xs font-bold uppercase tracking-widest text-[#8a9d88] transition hover:text-[#1b3022]"
              >
                Next quote →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
