import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { KanbanBoard } from "@/components/admin/kanban-board";
import { LayoutList, Trello } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const supabase = createAdminClient();
  
  // Fetch active enquiries
  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("*, profiles:assigned_to(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">CRM</p>
          <h1 className="mt-2 text-3xl font-black text-[#1b3022]">Sales Pipeline</h1>
        </div>
        
        <div className="flex bg-[#f2f6ec] p-1 rounded-full border border-[#d8e0d4]">
          <Link href="/super-admin/enquiries" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#6d7c6c] rounded-full hover:bg-white transition-all">
            <LayoutList className="w-4 h-4" /> List
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#1b3022] rounded-full shadow-md">
            <Trello className="w-4 h-4" /> Kanban
          </div>
        </div>
      </div>

      <KanbanBoard initialEnquiries={enquiries || []} />
    </div>
  );
}
