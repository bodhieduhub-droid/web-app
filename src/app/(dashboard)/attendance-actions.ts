"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireDashboardContext } from "@/lib/auth";
import { getHubSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { getISTDate, getISTDateString, getISTHour, getISTTimestamp } from "@/lib/date-utils";

type SimpleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function successState(message: string): SimpleActionState {
  return { status: "success", message };
}

function errorState(message: string): SimpleActionState {
  return { status: "error", message };
}

export async function checkInAction(formData?: FormData) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return errorState("Student record not found.");

  const supabase = createAdminClient();
  const settings = await getHubSettings();

  // IP Restriction Check
  // All students on the same WiFi share one public IP. Use the "Detect My IP"
  // button in Settings to always keep it current.
  const allowedIps = settings.allowed_attendance_ips || [];
  if (allowedIps.length > 0) {
    const headerList = await headers();
    const clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
      headerList.get("x-real-ip") ||
      null;

    const isAllowed = clientIp && allowedIps.some((entry) => clientIp === entry.trim());

    if (!isAllowed) {
      return errorState(
        `Access Denied: Please connect to the Reading Room WiFi to check in. (Your IP: ${clientIp || "Unknown"})`
      );
    }
  }

  const today = getISTDateString();

  // Check if already checked in today
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("reader_id", student.id)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return errorState("You have already checked in today.");
  }

  const { error } = await supabase.from("attendance").insert({
    reader_id: student.id,
    date: today,
    check_in_at: getISTTimestamp(),
  });

  if (error) return errorState(error.message);

  // Gamification: Award Badges
  await awardBadgeInternal(student.id);

  revalidatePath("/student");
  return successState("Check-in successful! Welcome to your study session.");
}

export async function checkOutAction(formData?: FormData) {
  const { student } = await requireDashboardContext(["student"]);
  if (!student) return errorState("Student record not found.");

  const supabase = createAdminClient();
  const today = getISTDateString();

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, check_out_at")
    .eq("reader_id", student.id)
    .eq("date", today)
    .maybeSingle();

  if (!attendance) return errorState("No check-in record found for today.");
  if (attendance.check_out_at) return errorState("You have already checked out today.");

  const { error } = await supabase
    .from("attendance")
    .update({ check_out_at: getISTTimestamp() })
    .eq("id", attendance.id);

  if (error) return errorState(error.message);

  revalidatePath("/student");
  return successState("Check-out recorded. See you next time!");
}

async function awardBadgeInternal(readerId: string) {
  const supabase = createAdminClient();
  const now = getISTDate();
  
  // 1. Welcome Badge (First visit)
  const { count: totalVisits } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("reader_id", readerId);

  if (totalVisits === 1) {
    await supabase.from("student_badges").upsert({
      reader_id: readerId,
      badge_type: "welcome",
      metadata: { awarded_on: getISTTimestamp() }
    }, { onConflict: "reader_id, badge_type" });
  }

  // 2. Early Bird (Check-in before 8 AM IST)
  if (getISTHour() < 8) {
    await supabase.from("student_badges").upsert({
      reader_id: readerId,
      badge_type: "early_bird",
      metadata: { last_early_check_in: getISTTimestamp() }
    }, { onConflict: "reader_id, badge_type" });
  }

  // 3. Streak Milestones
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("date")
    .eq("reader_id", readerId)
    .order("date", { ascending: false })
    .limit(31);

  if (recentAttendance && recentAttendance.length >= 3) {
    // 3-Day Spark
    if (checkStreak(recentAttendance, 3)) {
      await supabase.from("student_badges").upsert({
        reader_id: readerId,
        badge_type: "streak_3",
      }, { onConflict: "reader_id, badge_type" });
    }

    // Weekly Warrior
    if (checkStreak(recentAttendance, 7)) {
      await supabase.from("student_badges").upsert({
        reader_id: readerId,
        badge_type: "streak_7",
      }, { onConflict: "reader_id, badge_type" });
    }

    // Consistency King (30 total days in last 31 days)
    if (recentAttendance.length >= 30) {
      await supabase.from("student_badges").upsert({
        reader_id: readerId,
        badge_type: "streak_30",
      }, { onConflict: "reader_id, badge_type" });
    }
  }
}

function checkStreak(attendance: { date: string }[], days: number) {
  if (attendance.length < days) return false;
  for (let i = 0; i < days - 1; i += 1) {
    const d1 = new Date(attendance[i].date);
    const d2 = new Date(attendance[i + 1].date);
    const diff = (d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
    if (Math.round(diff) !== 1) return false;
  }
  return true;
}

export async function detectClientIpAction() {
  const headerList = await headers();
  const clientIp = headerList.get("x-forwarded-for")?.split(",")[0] || headerList.get("x-real-ip");
  return clientIp || "Unknown";
}
