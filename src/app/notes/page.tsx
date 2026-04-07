import Link from "next/link";
import { BookMarked, ChevronRight } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingHeroBackground } from "@/components/marketing/hero-background";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { getPublicPostHref, isExternalHref } from "@/lib/post-links";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const dummyNotes = [
  {
    id: "note-1",
    type: "note",
    title: "Indian Polity: Supreme Court Judgements 2025",
    summary:
      "A focused summary of major recent verdicts relevant for UPSC and State PSC preparation.",
    published_at: new Date().toISOString(),
  },
  {
    id: "note-2",
    type: "note",
    title: "Economy: Understanding the New Tax Regime",
    summary:
      "Clear revision notes on slabs, deductions, and the broader economic context aspirants should understand.",
    published_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "note-3",
    type: "note",
    title: "General Science: Space Missions of ISRO (2024-2026)",
    summary:
      "A quick revision module covering key missions, objectives, and exam-relevant takeaways.",
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "note-4",
    type: "note",
    title: "Geography: Changing Monsoon Patterns",
    summary:
      "A concise explanation of El Niño, La Niña, and their effect on the Indian monsoon.",
    published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default async function NotesPage() {
  const supabase = createAdminClient();
  const { data: notes } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("audience", "public")
    .eq("type", "note")
    .order("published_at", { ascending: false });

  const displayNotes = notes && notes.length > 0 ? notes : dummyNotes;

  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <MarketingNavbar />

      <section className="relative overflow-hidden border-b border-[#d5d2c6] bg-[linear-gradient(135deg,#f3f0e7_0%,#ece6d8_45%,#e5eddc_100%)]">
        <MarketingHeroBackground />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 md:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:py-22">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfd5c7] bg-white/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.28em] text-[#516250] shadow-sm backdrop-blur-sm">
              <BookMarked className="h-4 w-4" />
              Notes
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl font-serif text-[3.35rem] leading-[0.92] text-[#18281d] md:text-[4.8rem] lg:text-[5.3rem]">
                Public study notes for clearer preparation.
              </h1>
              <p className="max-w-lg text-base leading-7 text-[#405042] md:text-lg">
                Open reading material from Bodhi designed to simplify revision and help aspirants study with more direction.
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
                    What You&apos;ll Find
                  </p>
                  <p className="mt-2 max-w-sm font-serif text-[2rem] leading-tight">
                    Revision-friendly notes with less noise.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Concise revision material
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Competitive exam relevance
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm text-white/78">
                    Easier daily study flow
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
            Latest Notes
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl">
            Useful notes, ready to revise.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {displayNotes.map((note) => (
            <article key={note.id} className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              {(() => {
                const href = getPublicPostHref(note);
                const external = isExternalHref(href);
                return (
                  <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a]">
                  Study Note
                </p>
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#6d7c6c]">
                  {new Date(note.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="mt-4 font-serif text-[2rem] leading-tight text-[#1b3022]">{note.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#556455]">
                {note.summary ||
                  (note.content && typeof note.content === "string" ? note.content.slice(0, 180) : "")}
              </p>
              <div className="mt-8 border-t border-[#d8ddcf] pt-5">
                <Link
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#1b3022] transition-colors hover:text-[#4f5f4e]"
                >
                  Open Note
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
                  </>
                );
              })()}
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
                If the notes help, the reading room takes the next step further.
              </h2>
              <p className="mt-5 text-base leading-8 text-[#556455]">
                Use the material, then move into a calmer study environment built for daily consistency.
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
