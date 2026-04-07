import { ContentHub } from "@/components/dashboard/content-managers";
import type { PostRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function StaffContentPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Content</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Content Managers</h1>
        <p className="mt-2 text-sm font-semibold text-[#536352]">Use the dedicated page for blogs, notes, jobs, or alerts.</p>
      </section>

      <ContentHub basePath="/staff/content" rows={(posts ?? []) as PostRecord[]} />
    </div>
  );
}
