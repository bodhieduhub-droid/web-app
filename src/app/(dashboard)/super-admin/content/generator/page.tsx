"use client";

import { useState } from "react";
import { Sparkles, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { generateAIBlog, publishAIBlogAction } from "./actions";

export default function AIBlogGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    
    const res = await generateAIBlog(topic);
    if (res.error) {
      setError(res.error);
    } else if (res.content) {
      // Try to extract title from the first H1
      const titleMatch = res.content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        setTitle(titleMatch[1].trim());
      } else {
        setTitle(`Blog: ${topic}`); // Fallback
      }
      setGeneratedContent(res.content);
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!generatedContent || !title) return;
    setPublishing(true);
    setError("");

    const res = await publishAIBlogAction(title, generatedContent);
    if (res.error) {
      setError(res.error);
    } else {
      alert("Successfully published! Redirecting to content board.");
      window.location.href = "/super-admin/content";
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/super-admin/content" className="inline-flex items-center gap-2 text-sm font-bold text-[#6d7c6c] hover:text-[#1b3022]">
        <ArrowLeft className="w-4 h-4" /> Back to Content
      </Link>

      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex items-center gap-3">
          <div className="bg-[#e7efde] p-3 rounded-2xl">
            <Sparkles className="w-6 h-6 text-[#2f4d36]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1b3022]">AI Content Generator</h1>
            <p className="mt-1 text-sm font-semibold text-[#536352]">Automatically draft high-ranking SEO blog posts in seconds.</p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. 5 Ultimate Tips for IAS Aspirants in Kerala"
            className="flex-1 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-5 py-4 text-base font-semibold text-[#1b3022]"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="flex items-center gap-2 rounded-2xl bg-[#1b3022] px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
          </button>
        </div>
        
        {error && <p className="mt-4 text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}
      </section>

      {generatedContent && (
        <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
          <div className="mb-6 flex items-center justify-between">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-black text-[#1b3022] bg-transparent border-b border-dashed border-[#d7ddd3] w-2/3 pb-2 focus:outline-none focus:border-[#1b3022]"
            />
            <button 
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 rounded-2xl bg-[#2f4d36] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#e7efde] hover:bg-[#1b3022] transition-colors"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish to Website
            </button>
          </div>

          <div className="bg-[#f2f6ec] border border-[#d8e0d4] rounded-[1.4rem] p-6">
            <textarea 
              className="w-full min-h-[400px] bg-transparent resize-y focus:outline-none text-[#284632] font-mono text-sm leading-relaxed"
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
