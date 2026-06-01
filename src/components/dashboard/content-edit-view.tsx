"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  quickUpdatePostStatusAction,
  updatePostAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type PostRecord = {
  id: string;
  type: string;
  status: string;
  title: string;
  audience: string;
  exam_category?: string | null;
  summary?: string | null;
  content?: string;
  link_url?: string | null;
  cover_image_url?: string | null;
};

export function ContentEditView({ post }: { post: PostRecord }) {
  const isBlog = post.type === "blog";
  const [content, setContent] = useState(post.content || "");
  const [title, setTitle] = useState(post.title || "");
  const [summary, setSummary] = useState(post.summary || "");
  const [linkUrl, setLinkUrl] = useState(post.link_url || "");

  function asText(value: string | null | undefined, fallback: string) {
    return value && value.trim() ? value : fallback;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <form action={updatePostAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Edit Post</p>
        <input type="hidden" name="post_id" value={post.id} />
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <select name="type" defaultValue={post.type} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
            <option value="blog">Blog</option>
            <option value="note">Note</option>
            <option value="job">Job</option>
            <option value="exam_alert">Exam Alert</option>
          </select>
          <select name="audience" defaultValue={post.audience} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
            <option value="public">Public</option>
            <option value="student">Student</option>
          </select>
          <select name="exam_category" defaultValue={post.exam_category ?? ""} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
            <option value="">No exam category</option>
            {[
              "SSC",
              "UPSSC",
              "PSC",
              "UPSC",
              "BANKING",
              "RAILWAY",
            ].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={post.status} className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-xs font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
        />
        <input
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary"
          className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
        />
        <input
          name="link_url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="External link (optional)"
          className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
        />
        {isBlog ? (
          <input
            name="cover_image"
            type="file"
            accept="image/*"
            className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
          />
        ) : null}
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content (Markdown supported)"
          className="mt-2 min-h-[500px] w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-3 text-sm font-semibold text-[#1b3022] outline-none focus:border-[#1b3022] font-mono"
        />
        <PendingSubmitButton
          idleLabel="Save Changes"
          pendingLabel="Saving..."
          className="mt-3 rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
        />
      </form>

      <div className="space-y-4">
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Quick Status Actions</p>
          <div className="mt-3 grid gap-2">
            <form action={quickUpdatePostStatusAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="status" value="published" />
              <PendingSubmitButton
                idleLabel="Publish"
                pendingLabel="Publishing..."
                className="w-full rounded-xl bg-[#1b3022] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
              />
            </form>
            <form action={quickUpdatePostStatusAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="status" value="draft" />
              <PendingSubmitButton
                idleLabel="Move To Draft"
                pendingLabel="Updating..."
                className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
              />
            </form>
            <form action={quickUpdatePostStatusAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="status" value="archived" />
              <PendingSubmitButton
                idleLabel="Archive"
                pendingLabel="Archiving..."
                className="w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022]"
              />
            </form>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Live Preview</p>
          <div className="mt-3 rounded-xl border border-[#e4eae0] bg-[#f5f8f3] p-4 max-h-[800px] overflow-y-auto">
            {isBlog && post.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover_image_url} alt={title} className="mb-4 h-44 w-full rounded-xl object-cover" />
            ) : null}
            <p className="text-lg font-black text-[#1b3022]">{title || "Untitled"}</p>
            <p className="mt-2 text-sm font-semibold text-[#556455]">{asText(summary, "No summary")}</p>
            {linkUrl ? <p className="mt-3 break-all text-xs font-bold text-[#6d7c6c]">{linkUrl}</p> : null}
            <div className="mt-5 prose prose-sm prose-stone prose-headings:font-black prose-a:text-[#1b3022] prose-a:font-bold prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-[#d8e0d4] prose-th:bg-[#eaf0e8] prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-[#d8e0d4] prose-td:px-3 prose-td:py-2 max-w-none text-[#1b3022]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
