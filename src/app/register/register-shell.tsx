"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Mail, PhoneCall, ShieldCheck } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RegisterForm } from "./register-form";

export function RegisterShell({ openOnLoad = false }: { openOnLoad?: boolean }) {
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  useEffect(() => {
    if (!openOnLoad) {
      return;
    }

    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileFormOpen(true);
    }
  }, [openOnLoad]);

  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)] px-6 py-16 lg:py-20">
        <div className="relative mx-auto max-w-6xl space-y-8">
          <MarketingHeroBackground />
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
              Register
            </p>
            <h1 className="font-serif text-5xl leading-[0.94] text-[#18281d] sm:text-6xl">
              Join the reading room through a simple enquiry.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[#405042] md:text-lg">
              Share your details once. Our team will contact you and help you take the next step.
            </p>
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <section className="relative hidden overflow-hidden rounded-[2.5rem] border border-[#d8ddcf] bg-[#1f3828] p-8 text-white shadow-[0_26px_70px_rgba(24,40,29,0.18)] lg:block lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,230,216,0.16),transparent_32%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_48%)]" />
            <div className="relative space-y-8">
              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">
                  Reading Room Enquiry
                </p>
                <h1 className="max-w-xl font-serif text-5xl leading-[0.94] sm:text-6xl">
                  Start with a simple enquiry.
                </h1>
                <p className="max-w-xl text-base font-medium leading-7 text-white/80">
                  Tell us you&apos;re interested in the Bodhi Reading Room. Our team will contact you and guide the next step.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Step 1</p>
                  <p className="mt-3 text-lg font-black">Send details</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">Name, phone, and email.</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Step 2</p>
                  <p className="mt-3 text-lg font-black">Get contacted</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">Our team helps you choose the right plan.</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">Step 3</p>
                  <p className="mt-3 text-lg font-black">Join smoothly</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">Approved students continue into onboarding.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 lg:hidden">
                <Dialog open={mobileFormOpen} onOpenChange={setMobileFormOpen}>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-full bg-[#f0e6d2] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]">
                      Open Enquiry Form
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-0 sm:max-w-xl" showCloseButton={false}>
                    <DialogHeader className="px-6 pt-6 pb-0 text-left">
                      <DialogTitle className="font-serif text-3xl text-[#1b3022]">Book your enquiry.</DialogTitle>
                      <DialogDescription className="text-sm leading-6 text-[#576457]">
                        Fill this once. Our team will contact you and guide the next step.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 pt-4">
                      <RegisterForm />
                    </div>
                  </DialogContent>
                </Dialog>

                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/8"
                >
                  Contact Team
                </Link>
              </div>

              <div className="hidden flex-wrap gap-4 lg:flex">
                <Link
                  href="/contact-us"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f0e6d2] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]"
                >
                  Contact Team
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          <div className="lg:block">
            <RegisterForm />
          </div>
        </div>
      </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
