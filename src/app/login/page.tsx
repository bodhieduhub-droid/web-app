"use client";

import { Loader2, LockKeyhole, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginWithPassword } from "./actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginSchema, type LoginInput } from "./schemas";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const result = await loginWithPassword(data.email, data.password);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            <div className="flex items-center justify-between px-1">
              <label 
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50"
              >
                Email
              </label>
              {errors.email && (
                <span className="text-[10px] font-bold text-red-400 animate-in fade-in slide-in-from-right-1">
                  {errors.email.message}
                </span>
              )}
            </div>
            <div className="relative group">
              <Mail className={cn(
                "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                errors.email ? "text-red-400/50 group-focus-within:text-red-400" : "text-white/40 group-focus-within:text-white"
              )} />
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student@email.com"
                disabled={isPending}
                className={cn(
                  "w-full rounded-2xl border bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-4 disabled:opacity-50",
                  errors.email 
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-white/10 focus:border-white/30 focus:ring-white/5"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label 
                htmlFor="password"
                className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50"
              >
                Password
              </label>
              {errors.password && (
                <span className="text-[10px] font-bold text-red-400 animate-in fade-in slide-in-from-right-1">
                  {errors.password.message}
                </span>
              )}
            </div>
            <div className="relative group">
              <LockKeyhole className={cn(
                "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
                errors.password ? "text-red-400/50 group-focus-within:text-red-400" : "text-white/40 group-focus-within:text-white"
              )} />
              <input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={isPending}
                className={cn(
                  "w-full rounded-2xl border bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-4 disabled:opacity-50",
                  errors.password 
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                    : "border-white/10 focus:border-white/30 focus:ring-white/5"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 transition-colors hover:text-white outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm font-medium text-red-200 backdrop-blur-md animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            {error}
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
    </AuthShell>
  );
}


