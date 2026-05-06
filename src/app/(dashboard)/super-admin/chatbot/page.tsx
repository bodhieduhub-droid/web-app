import { createAdminClient } from "@/lib/supabase/admin";
import { MessageSquare, FileText, Upload, Brain, Database, Bot, Sparkles } from "lucide-react";
import { addDocumentChunk } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChatbotAdminPage() {
  const supabase = createAdminClient();

  const [leadCountRes, docsRes] = await Promise.all([
    supabase.from("enquiries").select("*", { count: "exact", head: true }),
    supabase.from("document_chunks").select("id, source_type, created_at").order("created_at", { ascending: false })
  ]);

  const leadCount = leadCountRes.count;
  const docs = docsRes.data;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.4rem] bg-[#1b3022] p-8 text-white shadow-2xl shadow-[#1b3022]/15">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-emerald-400" />
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/50">Bhanu AI Hub</p>
          </div>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-tight">Bhanu Dashboard</h1>
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-white/80">
            Analytics and Knowledge Base Management. Train Bhanu with your latest institutional guidelines.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 z-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]"></div>
        <div className="absolute -bottom-20 -left-20 z-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-[60px]"></div>
      </section>

      {/* Metrics Row */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="group rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 transition duration-300 hover:shadow-xl hover:shadow-[#27452e]/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Total Leads Captured</p>
            <div className="rounded-full bg-[#f3f7f0] p-2 transition-colors group-hover:bg-[#e4ebd8]">
              <MessageSquare className="h-4 w-4 text-[#6d7c6c]" />
            </div>
          </div>
          <p className="mt-4 text-5xl font-black text-[#1b3022]">{leadCount || 0}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI powered engagements</span>
          </div>
        </div>
        <div className="group rounded-[1.8rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6 transition duration-300 hover:shadow-xl hover:shadow-[#27452e]/10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Indexed Vectors</p>
            <div className="rounded-full bg-[#f3f7f0] p-2 transition-colors group-hover:bg-[#e4ebd8]">
              <Database className="h-4 w-4 text-[#6d7c6c]" />
            </div>
          </div>
          <p className="mt-4 text-5xl font-black text-[#1b3022]">{docs?.length || 0}</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#536352]">
            <span>Active document chunks</span>
          </div>
        </div>
      </section>

      {/* RAG Knowledge Resource Area */}
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6 overflow-hidden">
        <div className="border-b border-[#dde4d9] px-8 py-5 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <Brain className="h-5 w-5 text-[#284632]" />
             <h2 className="text-sm font-black uppercase tracking-widest text-[#1b3022]">Knowledge Resource (RAG)</h2>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#dde4d9]">
          <div className="p-8 bg-white">
            <p className="text-sm font-medium leading-relaxed text-[#536352] mb-8">
              Upload plain text documents like syllabus details, program guidelines, or marketing brochure text to train Bhanu.
            </p>
            
            <form action={addDocumentChunk} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#6d7c6c]">Document Type</label>
                <select name="type" className="w-full rounded-xl border border-[#dde3d5] bg-[#f5f8f3] px-4 py-3.5 text-sm font-semibold text-[#1b3022] outline-none transition focus:border-[#284632] focus:ring-2 focus:ring-[#284632]/20 hover:border-[#b8c7b4]">
                  <option value="brochure">Brochure Text</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="guideline">General Guideline</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#6d7c6c]">Content Payload</label>
                <textarea 
                  name="content"
                  placeholder="Paste exact text to be embedded into the Vector Database..."
                  className="w-full h-48 rounded-xl border border-[#dde3d5] bg-[#f5f8f3] p-4 text-sm font-medium leading-relaxed text-[#1b3022] outline-none transition focus:border-[#284632] focus:ring-2 focus:ring-[#284632]/20 hover:border-[#b8c7b4] resize-none"
                  required
                />
              </div>
              <button type="submit" className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3022] px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#284632] hover:shadow-lg hover:shadow-[#1b3022]/20 active:scale-[0.98]">
                <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Index into Vector DB
              </button>
            </form>
          </div>
          
          <div className="p-8 bg-[#f9faf8] relative">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6d7c6c] mb-6">Current Knowledge Base</h3>
            
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
              {docs && docs.length > 0 ? (
                docs.map(doc => (
                  <div key={doc.id} className="group flex items-center justify-between rounded-[1.2rem] border border-[#dde4d9] bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#b8c7b4] hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0f4ef] text-[#284632] transition-colors group-hover:bg-[#e4ebd8]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1b3022] capitalize">{doc.source_type}</p>
                        <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-[#6d7c6c] uppercase">
                          {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-[#dde4d9] bg-white p-6 text-center shadow-sm">
                  <div className="rounded-full bg-[#f5f8f3] p-4 text-[#a9b5a5]">
                    <Database className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#536352]">Knowledge base is empty</p>
                    <p className="mt-1 text-xs text-[#a9b5a5]">Upload documents to begin training Bhanu.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
