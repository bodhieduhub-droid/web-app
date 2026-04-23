import Link from "next/link";
import { ChevronRight, MapPinned, Phone } from "lucide-react";

import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { BelowFoldSections } from "@/components/marketing/below-fold-sections";

// ISR: page HTML is cached at the edge for 1 hour, then regenerated on next request.
// The landing page has no user-specific or real-time data, so there is no need for
// force-dynamic. This is the single biggest win for TTFB.
export const revalidate = 3600;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      {/* ── ABOVE FOLD — rendered in the very first HTML chunk ───────────── */}
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
                Quiet space, steady routine, and a better setup to stay consistent
                every day.
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
                      Quiet environment, fewer distractions, and a routine you can
                      return to every day.
                    </p>
                  </div>
                  <div className="rounded-[1.8rem] bg-[#f0e6d2] p-5 text-[#213022]">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#5b684f]">
                      Location
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <MapPinned className="mt-1 h-5 w-5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold leading-6">
                          Bakery Junction, Vazhuthacaud
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#5b684f]">
                          Thiruvananthapuram, Kerala
                        </p>
                      </div>
                    </div>
                    <a
                      href="tel:08089695014"
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1b3022] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2d4a35]"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      080896 95014
                    </a>
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

      {/* ── BELOW FOLD — deferred via IntersectionObserver ───────────────── */}
      {/* Skeleton shows instantly; real content mounts when user scrolls near */}
      <BelowFoldSections />
    </main>
  );
}
