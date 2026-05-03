import { NextResponse } from "next/server";

/**
 * eSSL K90 Pro - ADMS Get Request Endpoint
 *
 * The device polls this endpoint to check if there are any pending
 * commands from the server (e.g., add user, delete user, reboot).
 * For now, we simply reply with "OK" (no pending commands).
 */
export async function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
