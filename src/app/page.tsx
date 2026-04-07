import Link from "next/link";
import {
  BookOpenText,
  CalendarClock,
  ChevronRight,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";

const featureCards = [
  {
    eyebrow: "Reading Room",
    title: "A calm place that protects your attention.",
    copy:
      "The Vazhuthacaud reading room is designed for aspirants who need quiet structure, predictable study hours, and less friction between intention and execution.",
    icon: CalendarClock,
  },
  {
    eyebrow: "Education Hub",
    title: "Resources that add clarity instead of noise.",
    copy:
      "Bodhi Education Hub brings together notes, updates, and academic direction so your preparation keeps moving with purpose and context.",
    icon: BookOpenText,
  },
  {
    eyebrow: "One System",
    title: "Discipline in space, depth in study.",
    copy:
      "Together, the platform and reading room create a single routine that sharpens focus, supports consistency, and sustains long-term preparation.",
    icon: ShieldCheck,
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="relative overflow-hidden border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)]">
        <MarketingHeroBackground />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-22">
          <div className="space-y-6">
           

            <div className="space-y-3">
              <h1 className="max-w-3xl font-serif text-[3.35rem] leading-[0.92] text-[#18281d] md:text-[4.8rem] lg:text-[5.3rem]">
                A calm reading room for serious preparation.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#405042] md:text-lg">
                Quiet space, steady routine, and a better setup to stay consistent every day.
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
                Visit Us
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -left-2 top-8 hidden h-24 w-24 rounded-[2rem] border border-white/70 bg-white/55 blur-sm lg:block" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-[#cfd5c7] bg-[#1f3828] p-6 text-white shadow-[0_26px_70px_rgba(24,40,29,0.22)] lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,230,216,0.18),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_45%)]" />
              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/55">
                      Bodhi Reading Room
                    </p>
                    <p className="mt-2 max-w-sm font-serif text-[2rem] leading-tight">
                      Show up. Settle in. <br />
                      Study well.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.8rem] bg-white/8 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">
                      Why It Works
                    </p>
                    <p className="mt-3 text-base leading-7 text-white/78">
                      Quiet environment, fewer distractions, and a routine you can return to every day.
                    </p>
                  </div>
                  <div className="rounded-[1.8rem] bg-[#f0e6d2] p-5 text-[#213022]">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5b684f]">
                      Location
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <MapPinned className="mt-1 h-5 w-5 shrink-0" />
                      <p className="text-sm font-semibold leading-6">
                        Vazhuthacaud, Thiruvananthapuram
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/register?open=1"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f0e6d2] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]"
                >
                  Book Your Enquiry
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
            Why Bodhi
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
            Less noise. Better study.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {featureCards.map(({ eyebrow, title, copy, icon: Icon }) => (
            <article
              key={eyebrow}
              className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                <Icon className="h-7 w-7" />
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a]">
                {eyebrow}
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight text-[#1b3022]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#556455]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
              Reading Plans
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
              Pick the plan and start your routine.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#596857]">
            Most aspirants choose monthly for steady reading room access and better study continuity.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="relative flex flex-col overflow-hidden rounded-[2.7rem] bg-[#1f3828] p-8 text-white shadow-[0_30px_80px_rgba(24,40,29,0.22)] md:p-10">
            <div className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/80">
              Most Chosen
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55">Monthly</p>
            <div className="mt-8 flex flex-wrap items-end gap-3">
              <p className="font-serif text-6xl">₹1650</p>
              <p className="pb-2 text-sm font-bold uppercase tracking-[0.22em] text-white/55">
                per month
              </p>
            </div>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
              Best for aspirants who want a fixed reading room routine and a place they can return to every day.
            </p>
            <div className="mt-7 grid gap-3 text-sm text-white/80 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                Stable daily study routine
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                Full reading room access
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                Better focus retention
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                Best value for regular use
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register?open=1"
                className="inline-flex items-center justify-center rounded-full bg-[#f0e6d2] px-7 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#ead9b7]"
              >
                Choose Monthly
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/8"
              >
                Ask A Question
              </Link>
            </div>
          </article>

          <div className="grid gap-6">
            <article className="flex flex-col rounded-[2.3rem] border border-[#d8ddcf] bg-[#fffdf7] p-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a8878]">
                    Weekly
                  </p>
                  <p className="mt-4 font-serif text-4xl text-[#1b3022]">₹650</p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a8878]">Short term</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#596857]">
                Best for exam-week sprints or compact study cycles.
              </p>
              <Link
                href="/register?open=1"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#e7ecdd] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#dce5cf]"
              >
                Choose Weekly
              </Link>
            </article>

            <article className="flex flex-col rounded-[2.3rem] border border-[#d8ddcf] bg-[#fffdf7] p-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a8878]">
                    Daily
                  </p>
                  <p className="mt-4 font-serif text-4xl text-[#1b3022]">₹150</p>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a8878]">Flexible</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#596857]">
                Good for trial visits, quick revisions, or one-off sessions.
              </p>
              <Link
                href="/register?open=1"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#e7ecdd] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:bg-[#dce5cf]"
              >
                Choose Daily
              </Link>
            </article>
          </div>
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
                If the goal is serious preparation, the environment should be serious too.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#556455]">
                Bodhi Education Hub and the Bodhi Reading Room are built to reduce noise, strengthen
                discipline, and help aspirants stay with the work that matters.
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
