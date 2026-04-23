"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "./register-form";

export function RegisterShell() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#050806] font-sans selection:bg-[#345b41] selection:text-white py-12">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[10%] left-[10%] h-[40rem] w-[40rem] animate-pulse rounded-full bg-[#1b3022]/40 blur-[120px] mix-blend-screen" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[0%] right-[-10%] h-[35rem] w-[35rem] animate-pulse rounded-full bg-[#27452e]/30 blur-[100px] mix-blend-screen" style={{ animationDuration: '10s' }} />
        <div className="absolute left-[30%] top-[40%] h-[25rem] w-[25rem] animate-pulse rounded-full bg-[#132418]/50 blur-[80px] mix-blend-screen" style={{ animationDuration: '7s' }} />
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-[32rem] px-6 lg:px-8">
        <Link
          href="/"
          className="group mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back home
        </Link>

        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl lg:p-10">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
