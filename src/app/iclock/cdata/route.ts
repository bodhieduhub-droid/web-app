import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getISTDateString } from "@/lib/date-utils";

/**
 * eSSL K90 Pro - ADMS Push Data Endpoint
 *
 * The device communicates with two key requests:
 *  GET  /iclock/cdata?SN=xxx&...  → server sends config/time to the device
 *  POST /iclock/cdata?SN=xxx      → device sends attendance logs (ATTLOG)
 *
 * ATTLOG format (tab-separated per line):
 *   USERID  TIMESTAMP   STATUS  PUNCHTYPE
 *   101     2025-05-01 08:30:45  0   0
 */

// GET: Device handshake / time-sync
export async function GET(req: NextRequest) {
  const now = new Date();
  // Format: YYYY-MM-DD HH:MM:SS (no timezone, device interprets as local)
  const pad = (n: number) => String(n).padStart(2, "0");
  const serverTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // The device expects this exact text format in the response body
  const body = [
    `GET OPTION FROM: Server`,
    `Stamp=${Math.floor(Date.now() / 1000)}`,
    `ServerVer=2.4.1`,
    `PushOptionsFlag=1`,
    `TimeZone=330`, // IST = UTC+5:30 = 330 minutes
    `ErrorDelay=30`,
    `Realtime=1`,
    `TransFlag=0111111111`,
    `Encrypt=0`,
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// POST: Receive attendance logs
export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const supabase = createAdminClient();

    for (const line of lines) {
      // Only process ATTLOG lines
      if (!line.startsWith("ATTLOG")) continue;

      // Format: ATTLOG\tUSERID\tTIMESTAMP\tSTATUS\tPUNCHTYPE\t...
      const parts = line.split("\t");
      if (parts.length < 3) continue;

      const biometricId = parts[1]?.trim();
      const timestampStr = parts[2]?.trim();

      if (!biometricId || !timestampStr) continue;

      // Parse the timestamp as IST (machine sends local time)
      const punchTime = new Date(`${timestampStr.replace(" ", "T")}+05:30`);
      if (isNaN(punchTime.getTime())) continue;

      const punchDate = getISTDateString(punchTime);

      // 1. Try to find a matching student profile
      const { data: reader } = await supabase
        .from("readers")
        .select("id, status")
        .eq("biometric_id", biometricId)
        .maybeSingle();

      const isActiveReader =
        reader && ["active", "pending_payment"].includes(reader.status);

      // 2. Log the raw punch for admin visibility (always)
      await supabase.from("biometric_device_logs").insert({
        biometric_id: biometricId,
        punch_time: punchTime.toISOString(),
        punch_date: punchDate,
        reader_id: isActiveReader ? reader.id : null,
        status: isActiveReader ? "matched" : "unmatched",
      });

      // 3. If matched, record/update attendance
      if (isActiveReader) {
        const { data: existing } = await supabase
          .from("attendance")
          .select("id, check_in_at, check_out_at")
          .eq("reader_id", reader.id)
          .eq("date", punchDate)
          .maybeSingle();

        if (!existing) {
          // First punch of the day → check-in
          await supabase.from("attendance").insert({
            reader_id: reader.id,
            date: punchDate,
            check_in_at: punchTime.toISOString(),
            status: "present",
          });
        } else if (!existing.check_out_at) {
          // Second punch of the day → check-out (if >5 min after check-in)
          const checkInTime = new Date(existing.check_in_at);
          const diffMinutes =
            (punchTime.getTime() - checkInTime.getTime()) / 60000;
          if (diffMinutes > 5) {
            await supabase
              .from("attendance")
              .update({ check_out_at: punchTime.toISOString() })
              .eq("id", existing.id);
          }
        }
      }
    }

    // Device expects exactly "OK" on success
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[iclock/cdata] Error:", error);
    return new NextResponse("ERROR", { status: 500 });
  }
}
