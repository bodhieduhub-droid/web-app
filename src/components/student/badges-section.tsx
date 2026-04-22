"use client";

import { Award, Medal, Star, Zap, Flame, Trophy } from "lucide-react";
import type { StudentBadgeRecord } from "@/lib/app-types";

interface BadgesSectionProps {
  badges: StudentBadgeRecord[];
}

const BADGE_MAP: Record<string, { label: string; description: string; icon: any; color: string; bgColor: string }> = {
  welcome: {
    label: "Welcome",
    description: "Your first visit to Bodhi Hub",
    icon: Star,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  streak_3: {
    label: "3-Day Spark",
    description: "3 days of consistent study",
    icon: Flame,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  streak_7: {
    label: "Weekly Warrior",
    description: "7 days in a row - Impressive!",
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  streak_30: {
    label: "Consistency King",
    description: "30 days of dedication",
    icon: Trophy,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  early_bird: {
    label: "Early Bird",
    description: "Started before 8:00 AM",
    icon: Medal,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
};

export function BadgesSection({ badges }: BadgesSectionProps) {
  if (badges.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Your Achievements</p>
        <span className="text-[10px] font-black text-[#1b3022] bg-[#f0f7ed] px-2 py-0.5 rounded-md">
          {badges.length} Badges Earned
        </span>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((badge) => {
          const config = BADGE_MAP[badge.badge_type] || {
            label: badge.badge_type.replace("_", " "),
            description: "Achievement unlocked",
            icon: Award,
            color: "text-slate-600",
            bgColor: "bg-slate-50",
          };
          const Icon = config.icon;

          return (
            <div 
              key={badge.id}
              className="group relative flex items-center gap-3 rounded-[1.8rem] border border-[#d8e0d4] bg-white p-4 transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.bgColor} ${config.color} transition-transform group-hover:rotate-12`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#1b3022]">{config.label}</p>
                <p className="truncate text-[10px] font-medium text-[#6d7c6c]">{config.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
