"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  CalendarClock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";

// ─── Feature cards data ────────────────────────────────────────────────────
const featureCards = [
  {
    eyebrow: "Reading Room",
    title: "A calm place that protects your attention.",
    copy: "The Vazhuthacaud reading room is designed for aspirants who need quiet structure, predictable study hours, and less friction between intention and execution.",
    icon: CalendarClock,
  },
  {
    eyebrow: "Education Hub",
    title: "Resources that add clarity instead of noise.",
    copy: "Bodhi Education Hub brings together notes, updates, and academic direction so your preparation keeps moving with purpose and context.",
    icon: BookOpenText,
  },
  {
    eyebrow: "One System",
    title: "Discipline in space, depth in study.",
    copy: "Together, the platform and reading room create a single routine that sharpens focus, supports consistency, and sustains long-term preparation.",
    icon: ShieldCheck,
  },
];

// ─── Skeleton while not in viewport yet ───────────────────────────────────
function SectionSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      {/* Feature cards skeleton */}
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="mb-12 space-y-4">
          <div className="h-3 w-24 rounded-full bg-[#d8ddcf]" />
          <div className="h-10 w-72 rounded-[1rem] bg-[#e8ede0]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8"
            >
              <div className="h-14 w-14 rounded-2xl bg-[#e8ecdf]" />
              <div className="mt-6 h-3 w-20 rounded-full bg-[#e0e8d8]" />
              <div className="mt-4 h-8 w-4/5 rounded-[1rem] bg-[#edf2e8]" />
              <div className="mt-3 h-4 w-full rounded-full bg-[#edf2e8]" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-[#edf2e8]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Features section ──────────────────────────────────────────────────────
function FeaturesSection() {
  return (
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
            <h3 className="mt-4 font-serif text-3xl leading-tight text-[#1b3022]">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[#556455]">{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Pricing section ───────────────────────────────────────────────────────
function PricingSection() {
  return (
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
          Most aspirants choose monthly for steady reading room access and better
          study continuity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Monthly — featured */}
        <article className="relative flex flex-col overflow-hidden rounded-[2.7rem] bg-[#1f3828] p-8 text-white shadow-[0_30px_80px_rgba(24,40,29,0.22)] md:p-10">
          <div className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/80">
            Most Chosen
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55">
            Monthly
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-3">
            <p className="font-serif text-6xl">₹1650</p>
            <p className="pb-2 text-sm font-bold uppercase tracking-[0.22em] text-white/55">
              per month
            </p>
          </div>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
            Best for aspirants who want a fixed reading room routine and a place
            they can return to every day.
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

        {/* Weekly + Daily */}
        <div className="grid gap-6">
          <article className="flex flex-col rounded-[2.3rem] border border-[#d8ddcf] bg-[#fffdf7] p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#7a8878]">
                  Weekly
                </p>
                <p className="mt-4 font-serif text-4xl text-[#1b3022]">₹650</p>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a8878]">
                Short term
              </p>
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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#7a8878]">
                Flexible
              </p>
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
  );
}

// ─── CTA section ───────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section className="px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.8rem] border border-[#d8ddcf] bg-[linear-gradient(135deg,#fffdf7_0%,#f3efe2_48%,#e4eddb_100%)] p-10 shadow-[0_20px_60px_rgba(39,69,46,0.08)] md:p-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
              Start With Focus
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
              If the goal is serious preparation, the environment should be
              serious too.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#556455]">
              Bodhi Education Hub and the Bodhi Reading Room are built to reduce
              noise, strengthen discipline, and help aspirants stay with the work
              that matters.
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
  );
}

// ─── Main export: deferred below-fold content ─────────────────────────────
/**
 * Renders a lightweight skeleton instantly, then swaps in the real
 * sections once the element scrolls into view (IntersectionObserver).
 * This keeps Time-to-First-Byte fast and only pays the render cost
 * when the user actually needs the content.
 */
export function BelowFoldSections() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Show immediately if already in/near viewport (e.g. tall screens)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <>
          <FeaturesSection />
          <PricingSection />
          <CtaSection />
          <MarketingFooter />
        </>
      ) : (
        <SectionSkeleton />
      )}
    </div>
  );
}
