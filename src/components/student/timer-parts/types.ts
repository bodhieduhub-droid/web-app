import type { StudySessionRecord } from "@/lib/app-types";

export type PresetId = "pomodoro" | "long-focus" | "quick-sprint" | "custom";

export type StudyInsights = {
  todayMinutes: number;
  todayBlocks: number;
  weekMinutes: number;
  streakDays: number;
  totalBlocks: number;
  recentSessions: StudySessionRecord[];
  weeklyChartData?: { dayLabel: string; minutes: number }[];
};

export const PRESETS: Array<{ id: Exclude<PresetId, "custom">; label: string; work: number; rest: number }> = [
  { id: "pomodoro", label: "Pomodoro", work: 25, rest: 5 },
  { id: "long-focus", label: "Long Focus", work: 50, rest: 10 },
  { id: "quick-sprint", label: "Quick Sprint", work: 15, rest: 3 },
];

export const PRESET_LABEL_TO_ID: Record<string, PresetId> = {
  Pomodoro: "pomodoro",
  "Long Focus": "long-focus",
  "Quick Sprint": "quick-sprint",
  Custom: "custom",
};

export const EXAM_QUOTES: Record<string, string[]> = {
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

export const TIMER_STORAGE_KEY = "bodhi-study-timer-state-v1";
