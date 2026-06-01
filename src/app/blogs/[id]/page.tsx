import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { createAdminClient } from "@/lib/supabase/admin";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Handle dummy blog fallback if it matches dummy IDs
  if (resolvedParams.id.startsWith("dummy-")) {
    const dummyPost = {
      id: resolvedParams.id,
      title: "Sample Blog Post",
      type: "blog",
      status: "published",
      published_at: new Date().toISOString(),
      content: "This is a placeholder blog post. In a real scenario, this content would be fetched from your Supabase 'posts' table. Once you add real published blogs to the database, these dummy posts will disappear.",
      cover_image_url: null,
    };

    return (
      <main className="min-h-screen bg-[#f9f8f6] text-[#1b3022]">
        <MarketingNavbar />

        <article className="mx-auto max-w-3xl px-6 py-20 lg:py-32">
          <div className="mb-12">
            <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#6b795f] hover:text-[#1b3022] transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Back to Blogs
            </Link>
            
            <h1 className="font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl lg:text-6xl mb-6">
              {dummyPost.title}
            </h1>
            
            <div className="flex items-center gap-2 text-sm font-bold text-[#6b795f] uppercase tracking-widest">
              <Calendar className="w-4 h-4" />
              {new Date(dummyPost.published_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

          <div className="prose prose-lg prose-emerald max-w-none break-words prose-headings:font-serif prose-headings:text-[#1b3022] prose-a:text-emerald-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {dummyPost.content}
            </ReactMarkdown>
          </div>
        </article>

        <MarketingFooter />
      </main>
    );
  }

  const supabase = createAdminClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !post || post.type !== "blog" || post.status !== "published") {
    console.error("Blog 404 trigger:", { id: resolvedParams.id, error, post: post ? { type: post.type, status: post.status } : "null" });
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f9f8f6] text-[#1b3022]">
      <MarketingNavbar />

      <article className="mx-auto max-w-3xl px-6 py-20 lg:py-32">
        <div className="mb-12">
          <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#6b795f] hover:text-[#1b3022] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Blogs
          </Link>
          
          <h1 className="font-serif text-4xl leading-tight text-[#1b3022] md:text-5xl lg:text-6xl mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-2 text-sm font-bold text-[#6b795f] uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            {post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
          </div>
        </div>

        {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_image_url} alt={post.title} className="w-full h-[400px] object-cover rounded-[2rem] mb-12 shadow-xl shadow-[#1b3022]/5" />
        )}

        <div className="prose prose-lg prose-emerald max-w-none break-words prose-headings:font-serif prose-headings:text-[#1b3022] prose-a:text-emerald-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="mt-16 pt-10 border-t border-[#d8ddcf] flex flex-col items-center text-center">
            <h3 className="font-serif text-3xl text-[#1b3022] mb-4">Ready to elevate your study routine?</h3>
            <p className="text-lg text-[#405042] max-w-xl mb-8">Experience an environment engineered for deep focus. Join Bodhi Edu Hub.</p>
            <Link
                href="/register?open=1"
                className="inline-flex items-center gap-2 rounded-full bg-[#1d3525] px-8 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#294731] hover:shadow-[0_20px_40px_rgba(29,53,37,0.24)]"
              >
                Enquire Now
                <ArrowRight className="h-5 w-5" />
              </Link>
        </div>
      </article>

      <MarketingFooter />
    </main>
  );
}
