"use client";

import Link from "next/link";
import { Loader2, LockKeyhole, Mail, ArrowLeft } from "lucide-react";
import { useActionState } from "react";
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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#050806] font-sans selection:bg-[#345b41] selection:text-white">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[10%] left-[10%] h-[40rem] w-[40rem] animate-pulse rounded-full bg-[#1b3022]/40 blur-[120px] mix-blend-screen" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[0%] right-[-10%] h-[35rem] w-[35rem] animate-pulse rounded-full bg-[#27452e]/30 blur-[100px] mix-blend-screen" style={{ animationDuration: '10s' }} />
        <div className="absolute left-[30%] top-[40%] h-[25rem] w-[25rem] animate-pulse rounded-full bg-[#132418]/50 blur-[80px] mix-blend-screen" style={{ animationDuration: '7s' }} />
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-[28rem] px-6 py-12 lg:px-8">
        <Link
          href="/"
          className="group mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back home
        </Link>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:p-10">
          <form action={formAction} className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white/10 text-white shadow-inner ring-1 ring-white/20">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-[2.5rem] leading-tight text-white">
                  Welcome back.
                </h2>
                <p className="mt-2 text-[15px] font-medium leading-relaxed text-white/60">
                  Log in to access your portal.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Email</label>
                <div className="relative group">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="student@email.com"
                    required
                    disabled={isPending}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Password</label>
                <div className="relative group">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    disabled={isPending}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {state?.error ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm font-medium text-red-200 backdrop-blur-md animate-in fade-in slide-in-from-top-1">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                </span>
                {state.error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full overflow-hidden rounded-2xl bg-white px-5 py-4 text-[13px] font-black uppercase tracking-[0.2em] text-[#0a0f0d] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {isPending ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="flex justify-center pt-2">
              <p className="text-sm font-medium text-white/50">
                New here?{" "}
                <Link href="/register?open=1" className="font-bold text-white transition-colors hover:text-emerald-400">
                  Send an enquiry
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
