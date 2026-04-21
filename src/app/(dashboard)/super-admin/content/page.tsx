
import { ContentHub } from "@/components/dashboard/content-managers";
import type { PostRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminContentPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Content</p>
          <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Content Managers</h1>
          <p className="mt-2 text-sm font-semibold text-[#536352]">Manage your site content or use AI to generate new ranking articles.</p>
        </div>
        
        <div className="shrink-0">
          <a href="/super-admin/content/generator" className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 transition-colors px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            Auto-Generate Blog
          </a>
        </div>
      </section>

      <ContentHub basePath="/super-admin/content" rows={(posts ?? []) as PostRecord[]} />
    </div>
  );
}
