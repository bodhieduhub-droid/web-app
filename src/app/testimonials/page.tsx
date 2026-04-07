import Link from "next/link";
import { ChevronRight, MessageSquareQuote, Star } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";

const testimonials = [
  {
    name: "Ananya S.",
    role: "UPSC Aspirant",
    quote:
      "The calm environment is exactly what I needed. It helped me stay more regular with my study routine.",
  },
  {
    name: "Rahul M.",
    role: "State PSC Aspirant",
    quote:
      "The reading room feels serious in the right way. Once I sit down, it becomes much easier to stay focused.",
  },
  {
    name: "Meera K.",
    role: "Bank PO Aspirant",
    quote:
      "A steady place to study made a bigger difference than I expected. My preparation feels much more consistent now.",
  },
  {
    name: "Arjun V.",
    role: "Engineering Services",
    quote:
      "It is quiet, disciplined, and reliable. For long sessions, that matters more than anything else.",
  },
];

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="relative overflow-hidden border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)]">
        <MarketingHeroBackground />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-22">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfd5c7] bg-white/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#516250] shadow-sm backdrop-blur-sm">
              <MessageSquareQuote className="h-4 w-4" />
              Testimonials
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-serif text-[3.35rem] leading-[0.92] text-[#18281d] md:text-[4.8rem] lg:text-[5.3rem]">
                What aspirants say about the reading room.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#405042] md:text-lg">
                The strongest feedback is simple: the space helps people show up, settle in, and study with more consistency.
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
                    Common Theme
                  </p>
                  <p className="mt-2 max-w-sm font-serif text-[2rem] leading-tight">
                    A better room creates a better study rhythm.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Calm environment
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Stronger daily consistency
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Less distraction, more focus
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
            Reader Feedback
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
            Short, direct, and consistent.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]"
            >
              <div className="mb-6 flex gap-1 text-[#c59241]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="font-serif text-2xl leading-tight text-[#1b3022]">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-8 border-t border-[#d8ddcf] pt-5">
                <p className="text-sm font-black text-[#1b3022]">{item.name}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                  {item.role}
                </p>
              </div>
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
                If this is the kind of study space you want, the next step is simple.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#556455]">
                Send an enquiry and let the team help you get started with the Bodhi Reading Room.
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
