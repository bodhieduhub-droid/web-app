import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * eSSL Biometric Push API (ADMS Protocol)
 * 
 * This endpoint receives real-time attendance logs from the fingerprint machine.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sn = searchParams.get("SN"); // Serial Number of the machine

  try {
    const text = await req.text();
    const lines = text.split("\n").filter(line => line.trim().length > 0);
    const supabase = createAdminClient();

    const attendanceRecords = [];

    for (const line of lines) {
      // eSSL ADMS Log Format example:
      // USERID[tab]TIMESTAMP[tab]STATUS[tab]PUNCHTYPE
      // 101  2024-04-30 08:30:45  0  0
      
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;

      const biometricId = parts[0].trim();
      const timestampStr = parts[1].trim();
      
      // Find the reader (student) with this biometric_id
      const { data: reader } = await supabase
        .from("readers")
        .select("id, status")
        .eq("biometric_id", biometricId)
        .maybeSingle();

      if (reader && (reader.status === "active" || reader.status === "pending_payment")) {
        // The machine sends time in local IST. We must parse it explicitly as IST (+05:30)
        // so that .toISOString() converts it to the correct UTC timestamp for storage.
        const punchTime = new Date(`${timestampStr.replace(" ", "T")}+05:30`);
        
        // Use our utility to get the YYYY-MM-DD date string in IST
        const { getISTDateString } = await import("@/lib/date-utils");
        const dateStr = getISTDateString(punchTime);

        // Check if student already has a check-in for this date
        const { data: existing } = await supabase
          .from("attendance")
          .select("id, check_in_at, check_out_at")
          .eq("reader_id", reader.id)
          .eq("date", dateStr)
          .maybeSingle();

        if (!existing) {
          // New check-in
          attendanceRecords.push({
            reader_id: reader.id,
            date: dateStr,
            check_in_at: punchTime.toISOString(),
            status: "present"
          });
        } else if (!existing.check_out_at) {
          // Update as check-out if it's been more than 5 minutes since check-in
          const checkInTime = new Date(existing.check_in_at);
          const diffMinutes = (punchTime.getTime() - checkInTime.getTime()) / (1000 * 60);

          if (diffMinutes > 5) {
            await supabase
              .from("attendance")
              .update({ check_out_at: punchTime.toISOString() })
              .eq("id", existing.id);
          }
        }
      }
    }

    if (attendanceRecords.length > 0) {
      await supabase.from("attendance").insert(attendanceRecords);
    }

    // ADMS response format to acknowledge logs
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[Biometrics API Error]:", error);
    return new NextResponse("ERROR", { status: 500 });
  }
}

// GET request is often used by eSSL machines to fetch config or sync time
export async function GET(req: NextRequest) {
  return new NextResponse("OK", { status: 200 });
}
