"use client";

import { Coffee, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRESETS = [
  { label: "Pomodoro", work: 25, rest: 5 },
  { label: "Long Focus", work: 50, rest: 10 },
  { label: "Quick Sprint", work: 15, rest: 3 },
];

const EXAM_QUOTES: Record<string, string[]> = {
  UPSC: [
    "Every page you read today is a step closer to your IAS dream.",
    "UPSC is not just an exam — it's a transformation of character.",
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
    "Speed and accuracy — the twin pillars of banking exams.",
    "Every arithmetic problem you solve is money in the bank.",
    "Aptitude is trainable. Train hard.",
  ],
  RAILWAY: [
    "Railways connects the nation. Let your success connect your future.",
    "Technical knowledge + speed = Railway success.",
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
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StudyTimerPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [examCategory, setExamCategory] = useState<string>("DEFAULT");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydratedRef = useRef(false);

  const quotes = EXAM_QUOTES[examCategory] ?? EXAM_QUOTES.DEFAULT;
  const progress = 1 - secondsLeft / ((phase === "work" ? preset.work : preset.rest) * 60);
  const circumference = 2 * Math.PI * 110;

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const raw = window.localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        presetLabel?: string;
        phase?: "work" | "rest";
        secondsLeft?: number;
        running?: boolean;
        sessions?: number;
        quoteIndex?: number;
        examCategory?: string;
        savedAt?: string;
      };

      const matchedPreset = PRESETS.find((p) => p.label === parsed.presetLabel) ?? PRESETS[0];
      const storedPhase = parsed.phase === "rest" ? "rest" : "work";
      let storedSecondsLeft = Number.isFinite(parsed.secondsLeft) ? Math.max(1, Number(parsed.secondsLeft)) : matchedPreset.work * 60;
      let storedSessions = Number.isFinite(parsed.sessions) ? Math.max(0, Number(parsed.sessions)) : 0;
      let currentPhase: "work" | "rest" = storedPhase;
      let isRunning = parsed.running === true;
      const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : Date.now();
      let elapsed = isRunning ? Math.floor((Date.now() - savedAt) / 1000) : 0;

      while (elapsed > 0) {
        if (elapsed < storedSecondsLeft) {
          storedSecondsLeft -= elapsed;
          elapsed = 0;
          break;
        }
        elapsed -= storedSecondsLeft;
        if (currentPhase === "work") {
          storedSessions += 1;
          currentPhase = "rest";
          storedSecondsLeft = matchedPreset.rest * 60;
        } else {
          currentPhase = "work";
          storedSecondsLeft = matchedPreset.work * 60;
        }
      }

      setPreset(matchedPreset);
      setPhase(currentPhase);
      setSecondsLeft(storedSecondsLeft);
      setRunning(isRunning);
      setSessions(storedSessions);
      setQuoteIndex(Number.isFinite(parsed.quoteIndex) ? Number(parsed.quoteIndex) : 0);
      setExamCategory(parsed.examCategory || "DEFAULT");
    } catch {
      window.localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        presetLabel: preset.label,
        phase,
        secondsLeft,
        running,
        sessions,
        quoteIndex,
        examCategory,
        savedAt: new Date().toISOString(),
      }),
    );
  }, [preset.label, phase, secondsLeft, running, sessions, quoteIndex, examCategory]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (phase === "work") {
              setSessions((prev) => prev + 1);
              setPhase("rest");
              setSecondsLeft(preset.rest * 60);
            } else {
              setPhase("work");
              setSecondsLeft(preset.work * 60);
            }
            setQuoteIndex((i) => (i + 1) % quotes.length);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, phase, preset, quotes.length]);

  function changePreset(p: typeof PRESETS[0]) {
    setPreset(p);
    setPhase("work");
    setSecondsLeft(p.work * 60);
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(preset.work * 60);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Study Timer</p>
        <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Focus Mode</h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/80">
          Use the Pomodoro technique to maximize deep work. Study hard, rest smart.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Timer card */}
        <div className="flex flex-col items-center rounded-[2rem] border border-[#d8e0d4] bg-white p-8 shadow-xl shadow-[#27452e]/8">
          {/* Phase badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] ${phase === "work" ? "bg-[#1b3022] text-white" : "bg-emerald-100 text-emerald-800"}`}>
            {phase === "work" ? <Target className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
            {phase === "work" ? "Focus" : "Rest"}
          </span>

          {/* SVG ring timer */}
          <div className="relative mt-8 flex items-center justify-center">
            <svg viewBox="0 0 240 240" className="h-56 w-56 -rotate-90">
              <circle cx="120" cy="120" r="110" fill="none" stroke="#eef3ea" strokeWidth="12" />
              <circle
                cx="120" cy="120" r="110"
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
              <p className="text-5xl font-black tabular-nums text-[#1b3022]">{formatTime(secondsLeft)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8a9d88]">
                {phase === "work" ? "minutes left" : "rest time"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-2xl bg-[#1b3022] px-8 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-[#1b3022]/25 transition hover:bg-[#27452e]"
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="rounded-2xl border border-[#d8e0d4] px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#536352] transition hover:bg-[#f3f7f0]"
            >
              Reset
            </button>
          </div>

          {/* Session count */}
          <div className="mt-8 flex items-center gap-2">
            {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
              <div key={i} className={`h-3 w-3 rounded-full ${i < sessions ? "bg-[#1b3022]" : "bg-[#eef3ea]"}`} />
            ))}
            <p className="ml-2 text-xs font-bold text-[#8a9d88]">{sessions} session{sessions !== 1 ? "s" : ""} today</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Preset selector */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Timer Preset</p>
            <div className="mt-4 space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => changePreset(p)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${preset.label === p.label ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] text-[#1b3022] hover:bg-[#f3f7f0]"}`}
                >
                  <p className="text-sm font-black">{p.label}</p>
                  <p className={`text-xs font-medium ${preset.label === p.label ? "text-white/70" : "text-[#8a9d88]"}`}>
                    {p.work} min work · {p.rest} min rest
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Exam category */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Your Exam</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["DEFAULT", "UPSC", "SSC", "PSC", "BANKING", "RAILWAY"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setExamCategory(cat)}
                  className={`rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${examCategory === cat ? "border-[#1b3022] bg-[#1b3022] text-white" : "border-[#d8e0d4] text-[#536352] hover:border-[#1b3022]/40"}`}
                >
                  {cat === "DEFAULT" ? "General" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Motivational quote */}
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-[#fafdf8] p-6 shadow-lg shadow-[#27452e]/6">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Today's Thought</p>
            <p className="mt-4 text-base font-bold italic leading-7 text-[#1b3022]">
              "{quotes[quoteIndex % quotes.length]}"
            </p>
            <button
              onClick={() => setQuoteIndex((i) => (i + 1) % quotes.length)}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-[#8a9d88] hover:text-[#1b3022] transition"
            >
              Next quote →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
