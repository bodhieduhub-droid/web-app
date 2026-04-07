import { NotesManagerPage } from "@/components/dashboard/content-managers";
import type { PostRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminNotesManagerPage() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  return <NotesManagerPage rows={(posts ?? []) as PostRecord[]} detailBasePath="/super-admin/content" />;
}
