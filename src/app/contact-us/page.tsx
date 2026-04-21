import Link from "next/link";
import { ChevronRight, Clock, Mail, MapPin, Phone, Send } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="relative overflow-hidden border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)]">
        <MarketingHeroBackground />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-22">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfd5c7] bg-white/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#516250] shadow-sm backdrop-blur-sm">
              <Mail className="h-4 w-4" />
              Contact Us
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-serif text-[3.35rem] leading-[0.92] text-[#18281d] md:text-[4.8rem] lg:text-[5.3rem]">
                Get in touch with the Bodhi team.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#405042] md:text-lg">
                Ask about the reading room, visiting, plans, or getting started. We keep the process direct and simple.
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
              <a
                href="tel:08089695014"
                className="inline-flex items-center gap-2 rounded-full border border-[#1d3525] bg-white/70 px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#1d3525] transition-colors hover:bg-[#1d3525] hover:text-white"
              >
                Call Us
              </a>
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="absolute -left-2 top-8 hidden h-24 w-24 rounded-[2rem] border border-white/70 bg-white/55 blur-sm lg:block" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-[#cfd5c7] bg-[#1f3828] p-6 text-white shadow-[0_26px_70px_rgba(24,40,29,0.22)] lg:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,230,216,0.18),transparent_35%),linear-gradient(160deg,rgba(255,255,255,0.04),transparent_45%)]" />
              <div className="relative space-y-5">
                <div className="border-b border-white/10 pb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/55">
                    Quick Contact
                  </p>
                  <p className="mt-2 max-w-sm font-serif text-[2rem] leading-tight">
                    Reach out and we&apos;ll help you from there.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Phone: 080896 95014
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Email: ops@bodhieduhub.com
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Vazhuthacaud, Thiruvananthapuram
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
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a]">
              Contact Details
            </p>
            <div className="mt-8 space-y-7">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-[#1b3022]">080896 95014</p>
                  <p className="mt-1 text-sm leading-7 text-[#556455]">Call for reading room and joining queries.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-[#1b3022]">ops@bodhieduhub.com</p>
                  <p className="mt-1 text-sm leading-7 text-[#556455]">Best for detailed questions and follow-up communication.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-[#1b3022]">Vazhuthacaud</p>
                  <p className="mt-1 text-sm leading-7 text-[#556455]">
                    Bakery Junction, Vazhuthacaud, Thiruvananthapuram, Kerala
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8ecdf] text-[#1b3022]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-serif text-2xl text-[#1b3022]">Visiting Hours</p>
                  <p className="mt-1 text-sm leading-7 text-[#556455]">
                    Mon-Sat, 8am-8pm. Calling ahead is recommended before visiting.
                  </p>
                </div>
              </div>
            </div>
          </article>

          <form className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a]">
              Send Message
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022]">
              Tell us what you need.
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                  Full Name
                </label>
                <input
                  placeholder="Ananya S."
                  className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-5 py-4 text-sm text-[#1b3022] outline-none transition-colors focus:border-[#1d3525]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                  Phone
                </label>
                <input
                  placeholder="+91 90000 00000"
                  className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-5 py-4 text-sm text-[#1b3022] outline-none transition-colors focus:border-[#1d3525]"
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                Email
              </label>
              <input
                type="email"
                placeholder="ananya@example.com"
                className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-5 py-4 text-sm text-[#1b3022] outline-none transition-colors focus:border-[#1d3525]"
              />
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                Message
              </label>
              <textarea
                placeholder="How can we help you?"
                className="min-h-40 w-full rounded-2xl border border-[#d8ddcf] bg-white px-5 py-4 text-sm text-[#1b3022] outline-none transition-colors focus:border-[#1d3525]"
              />
            </div>

            <button
              type="button"
              className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#1d3525] px-6 py-4 text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#294731]"
            >
              Send Message
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#6b795f]">
            Find Us
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
            Visit the reading room.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#556455]">
            Located at Bakery Junction, Vazhuthacaud. Call ahead before visiting so we can welcome you properly.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.4fr]">
          <div className="overflow-hidden rounded-[2.4rem] border border-[#d8ddcf] shadow-[0_18px_45px_rgba(39,69,46,0.08)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d246.62424849095837!2d76.95720690851914!3d8.500547443685742!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05bb7a500085fb%3A0x379d75d0d6cea7d2!2sBodhi-The%20Reading%20Room!5e0!3m2!1sen!2sin!4v1776787464011!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Bodhi Reading Room Location"
              className="rounded-[2.4rem]"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-[#d8ddcf] bg-[#fffdf7] p-6 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6b795f]">Phone</p>
              <a href="tel:08089695014" className="mt-2 block font-serif text-2xl text-[#1b3022] hover:text-[#294731] transition-colors">
                080896 95014
              </a>
            </div>
            <div className="rounded-[1.8rem] border border-[#d8ddcf] bg-[#fffdf7] p-6 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6b795f]">Address</p>
              <p className="mt-2 text-lg font-semibold text-[#1b3022] leading-relaxed">
                Bodhi - The Reading Room<br />
                Bakery Junction<br />
                Vazhuthacaud<br />
                Thiruvananthapuram, Kerala
              </p>
            </div>
            <div className="rounded-[1.8rem] border border-[#d8ddcf] bg-[#fffdf7] p-6 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6b795f]">Visiting Hours</p>
              <p className="mt-2 text-base text-[#556455]">
                Mon-Sat, 8am-8pm<br />
                <span className="text-sm">Calling ahead recommended</span>
              </p>
            </div>
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
                If you&apos;re ready to ask, we&apos;re ready to help.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#556455]">
                Reach out for the reading room, plans, or a visit, and the team will point you in the right direction.
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
              <a
                href="tel:08089695014"
                className="inline-flex items-center gap-2 rounded-full border border-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#1d3525] transition-colors hover:bg-[#1d3525] hover:text-white"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
