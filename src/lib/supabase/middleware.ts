import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { normalizeRole } from "@/lib/billing-utils";

const PUBLIC_PATHS = ["/", "/login", "/admin-login", "/register"];
const PROTECTED_PREFIXES = ["/super-admin", "/staff", "/student", "/reader"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function roleHome(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "staff") return "/staff";
  return "/student";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const home = roleHome(profile?.role);

  if (pathname === "/reader") {
    const url = request.nextUrl.clone();
    url.pathname = "/student";
    return NextResponse.redirect(url);
  }

  if (isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/super-admin") && normalizeRole(profile?.role) !== "super_admin") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/staff")) {
    const normalizedRole = normalizeRole(profile?.role);
    if (normalizedRole !== "staff" && normalizedRole !== "super_admin") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/student")) {
    const normalizedRole = normalizeRole(profile?.role);
    if (normalizedRole !== "student") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Only fetch student status if we are on a student path
    const { data: student } = await supabase
      .from("readers")
      .select("onboarding_completed, status, caution_refunded")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      if (student.status === "archived" && student.caution_refunded === true) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      if (student.status !== "archived" && !student.onboarding_completed && !pathname.startsWith("/student/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/student/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
