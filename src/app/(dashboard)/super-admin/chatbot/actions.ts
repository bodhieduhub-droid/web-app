"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function addDocumentChunk(formData: FormData) {
  const supabase = createAdminClient();
  const content = formData.get("content") as string;
  const type = formData.get("type") as string;
  
  if (content && type) {
    await supabase.from("document_chunks").insert({ content, source_type: type });
    revalidatePath("/super-admin/chatbot");
  }
}
