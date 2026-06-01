import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ArrowRight, ExternalLink } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { createAdminClient } from "@/lib/supabase/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = createAdminClient();
  
  const { data: post } = await supabase
    .from("posts")
    .select("title, summary, content")
    .eq("id", resolvedParams.id)
    .single();

  if (!post) {
    return {
      title: "Job Not Found - Bodhi Edu Hub",
    };
  }

  const description = post.summary || 
    (post.content && typeof post.content === "string" ? post.content.slice(0, 160) : "Job update from Bodhi Edu Hub");

  return {
    title: `${post.title} - Bodhi Edu Hub`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = createAdminClient();
  
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !post || post.type !== "job" || post.status !== "published") {
    notFound();
  }
  
  // If there's a link_url that's not just a placeholder, we show it prominently
  let displayLink = (post.link_url || "").trim();
  const hasLink = displayLink.startsWith("http") || displayLink.startsWith("/");

  // NEW: Smart Link Extraction
  // If the link is malformed (e.g. "file.pdf http://link"), try to extract the http part
  let extractedLink = displayLink;
  if (!hasLink && displayLink.includes("http")) {
    const match = displayLink.match(/https?:\/\/[^\s]+/);
    if (match) extractedLink = match[0];
  }
  const isExtracted = !hasLink && extractedLink !== displayLink && extractedLink.startsWith("http");

  return (
    <main className="min-h-screen bg-[#f9f8f6] text-[#1b3022]">
      <MarketingNavbar />

      <article className="mx-auto max-w-4xl px-6 py-20 lg:py-32">
        <div className="mb-12">
          <Link href="/job-opportunities" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#6b795f] hover:text-[#1b3022] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Job Opportunities
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[#78846a] bg-[#eef3ea] px-3 py-1 rounded-full">
              Job Update
            </span>
            {post.exam_category && (
              <span className="text-[10px] font-black uppercase tracking-[0.32em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {post.exam_category}
              </span>
            )}
          </div>

          <h1 className="font-serif text-4xl leading-[1.1] text-[#1b3022] md:text-5xl lg:text-6xl mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-2 text-sm font-bold text-[#6b795f] uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            {post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
          </div>
        </div>

        {(hasLink || isExtracted) && (
          <div className="mb-10 p-6 rounded-[2rem] border border-emerald-100 bg-emerald-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-black text-[#1b3022]">Application / Notification Link</h3>
              <p className="text-sm text-[#536352] mt-1">
                {isExtracted ? "We detected an external link in the description." : "Access the official portal or detailed notification document."}
              </p>
            </div>
            <a 
              href={isExtracted ? extractedLink : displayLink} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1b3022] px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#27452e]"
            >
              Open Link
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        <div className="prose prose-lg prose-emerald max-w-none break-words prose-headings:font-serif prose-headings:text-[#1b3022] prose-a:text-emerald-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Only show reference info if we couldn't find ANY usable link */}
        {!hasLink && !isExtracted && displayLink && (
            <div className="mt-12 p-6 rounded-[1.5rem] bg-amber-50 border border-amber-100">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Reference Info</p>
                <p className="text-sm text-amber-900 font-mono break-all">{post.link_url}</p>
                <p className="text-[10px] text-amber-700 mt-2 italic">Copy and paste this link if it doesn&apos;t open automatically.</p>
            </div>
        )}

        <div className="mt-20 pt-10 border-t border-[#d8ddcf] flex flex-col items-center text-center">
            <h3 className="font-serif text-3xl text-[#1b3022] mb-4">Start your preparation journey today.</h3>
            <p className="text-lg text-[#405042] max-w-xl mb-8">Bodhi Reading Room provides the silence and structure you need to clear the most competitive exams.</p>
            <div className="flex flex-wrap justify-center gap-4">
                <Link
                    href="/register?open=1"
                    className="inline-flex items-center gap-2 rounded-full bg-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#294731]"
                >
                    Enquire Now
                    <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                    href="/contact-us"
                    className="inline-flex items-center gap-2 rounded-full border border-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#1d3525] transition-colors hover:bg-[#1d3525] hover:text-white"
                >
                    Contact Us
                </Link>
            </div>
        </div>
      </article>

      <MarketingFooter />
    </main>
  );
}
