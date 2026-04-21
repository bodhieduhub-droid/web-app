"use client";

import Link from "next/link";
import { ChevronRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { loginWithPassword } from "./actions";

interface LoginState {
  error?: string;
  success?: boolean;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    async (_, formData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      return loginWithPassword(email, password);
    },
    {}
  );

  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)] px-6 py-16 lg:py-20">
        <div className="relative mx-auto max-w-6xl space-y-8">
          <MarketingHeroBackground />
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
              Login
            </p>
            <h1 className="font-serif text-5xl leading-[0.94] text-[#18281d] sm:text-6xl">
              Sign in and continue your study routine.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#405042] md:text-lg">
              If you already have your credentials, log in below. If not, start with an enquiry.
            </p>
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="relative hidden overflow-hidden rounded-[2.5rem] border border-[#d8ddcf] bg-[#1f3828] p-8 text-white shadow-[0_26px_70px_rgba(24,40,29,0.18)] lg:block lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,230,216,0.16),transparent_32%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_48%)]" />
            <div className="relative space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">
                  Portal Login
                </p>
                <h1 className="max-w-xl font-serif text-5xl leading-[0.94] sm:text-6xl">
                  Sign in and continue your routine.
                </h1>
                <p className="max-w-xl text-base font-medium leading-7 text-white/80">
                  Student, staff, and team access all start here. If you already have your credentials, log in below.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Students</p>
                  <p className="mt-3 text-lg font-black">Dashboard access</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">Use the credentials sent after approval.</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">New Here?</p>
                  <p className="mt-3 text-lg font-black">Send enquiry</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">We&apos;ll help you get started first.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register?open=1"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f0e6d2] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]"
                >
                  Need An Account?
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <form
            action={formAction}
            className="space-y-5 rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.08)] lg:p-8"
          >
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#6a7b69]">Login</p>
              <h2 className="font-serif text-4xl leading-tight text-[#1b3022]">Welcome back.</h2>
              <p className="text-sm font-medium leading-6 text-[#576457]">
                Enter your credentials to access the Bodhi portal.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7b69]" />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="student@email.com"
                    required
                    disabled={isPending}
                    className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-11 py-4 text-sm font-semibold text-[#1b3022] outline-none transition-all focus:border-[#1b3022] focus:ring-2 focus:ring-[#1b3022]/10 disabled:opacity-60"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7b69]" />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                    disabled={isPending}
                    className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-11 py-4 text-sm font-semibold text-[#1b3022] outline-none transition-all focus:border-[#1b3022] focus:ring-2 focus:ring-[#1b3022]/10 disabled:opacity-60"
                  />
                </div>
              </label>
            </div>

            {state?.error ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[#e7d0d0] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#8a2f2f]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8a2f2f]" />
                {state.error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="group w-full rounded-full bg-[#1b3022] px-5 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all hover:shadow-lg hover:shadow-[#1b3022]/25 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isPending ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#6a7b69]">
              <Link href="/">Back Home</Link>
              <Link href="/register?open=1">Send Enquiry</Link>
            </div>
          </form>
        </div>
      </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
