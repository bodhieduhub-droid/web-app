import { NextResponse } from "next/server";

/**
 * Dummy route to silence 404 errors for /api/auth/session.
 * This request is often triggered by browser extensions or third-party 
 * libraries that expect NextAuth, even if the project doesn't use it.
 */
export async function GET() {
  return NextResponse.json(null);
}
