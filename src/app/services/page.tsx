import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";

const services = [
  {
    eyebrow: "Reading Room",
    title: "Monthly access for consistent preparation.",
    body: "A stable study base for aspirants who want to return to the same calm environment every day.",
    icon: CalendarClock,
  },
  {
    eyebrow: "Onboarding",
    title: "Simple enquiry and joining flow.",
    body: "Reach the team, ask questions, and get guided into the reading room without unnecessary friction.",
    icon: MapPin,
  },
  {
    eyebrow: "Billing",
    title: "Clear and direct payment process.",
    body: "Straightforward manual billing keeps the process transparent and easy to understand.",
    icon: CreditCard,
  },
  {
    eyebrow: "Support",
    title: "Relevant updates for serious aspirants.",
    body: "Notes, alerts, and guidance are designed to support preparation, not distract from it.",
    icon: FileText,
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="relative overflow-hidden border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)]">
        <MarketingHeroBackground />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-22">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfd5c7] bg-white/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#516250] shadow-sm backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              Services
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-serif text-[3.35rem] leading-[0.92] text-[#18281d] md:text-[4.8rem] lg:text-[5.3rem]">
                Everything built around focused study.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#405042] md:text-lg">
                Bodhi services are designed to make joining, studying, and staying consistent inside the reading room feel straightforward.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <Link
                href="/register?open=1"
                className="inline-flex items-center gap-2 rounded-full bg-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#294731] hover:shadow-[0_20px_40px_rgba(29,53,37,0.24)]"
              >
                Enquire Now
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 rounded-full border border-[#1d3525] bg-white/70 px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#1d3525] transition-colors hover:bg-[#1d3525] hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -left-2 top-8 hidden h-24 w-24 rounded-[2rem] border border-white/70 bg-white/55 blur-sm lg:block" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-[#cfd5c7] bg-[#1f3828] p-6 text-white shadow-[0_26px_70px_rgba(24,40,29,0.22)] lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,230,216,0.18),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_45%)]" />
              <div className="relative space-y-5">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/55">
                    What You Get
                  </p>
                  <p className="mt-2 max-w-sm font-serif text-[2rem] leading-tight">
                    A simpler path into a better study routine.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Calm reading room access
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Smooth enquiry and onboarding
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Clear billing and support
                  </div>
                </div>

                <Link
                  href="/register?open=1"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f0e6d2] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]"
                >
                  Start Your Enquiry
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
            Core Services
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
            Built to reduce friction and protect focus.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {services.map(({ eyebrow, title, body, icon: Icon }) => (
            <article
              key={title}
              className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                <Icon className="h-7 w-7" />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a]">
                {eyebrow}
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight text-[#1b3022]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#556455]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.8rem] border border-[#d8ddcf] bg-[linear-gradient(135deg,#fffdf7_0%,#f3efe2_48%,#e4eddb_100%)] p-10 shadow-[0_20px_60px_rgba(39,69,46,0.08)] md:p-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
                Start With Focus
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
                If the study routine matters, the setup should too.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#556455]">
                Join the Bodhi Reading Room through a simple enquiry and build your preparation in a calmer, more deliberate space.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register?open=1"
                className="inline-flex items-center gap-2 rounded-full bg-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#294731]"
              >
                Send Enquiry
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 rounded-full border border-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#1d3525] transition-colors hover:bg-[#1d3525] hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
