import { BlogManagerPage } from "@/components/dashboard/blog-manager-page";
import type { PostRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminBlogsManagerPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  return <BlogManagerPage rows={(posts ?? []) as PostRecord[]} detailBasePath="/super-admin/content" />;
}
