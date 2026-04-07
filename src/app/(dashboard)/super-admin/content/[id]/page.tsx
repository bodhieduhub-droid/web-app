import Link from "next/link";
import { notFound } from "next/navigation";

import {
  quickUpdatePostStatusAction,
  updatePostAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { PostRecord } from "@/lib/app-types";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { id: string };

function asText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function asDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN");
}

export default async function SuperAdminContentDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const post = data as PostRecord & {
    summary?: string | null;
    content?: string;
    created_at?: string;
    updated_at?: string;
    published_at?: string | null;
    author_profile_id?: string | null;
  };

  const excerpt = asText(post.summary, post.content?.slice(0, 220) || "No summary");
  const isBlog = post.type === "blog";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Content Detail</p>
            <h1 className="mt-3 text-3xl font-black text-[#1b3022]">{post.title}</h1>
            <p className="mt-2 text-sm font-semibold text-[#536352]">{excerpt}</p>
          </div>
          <div className="text-right">
            <p className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
              {post.status.replaceAll("_", " ")}
            </p>
            <Link
              href="/super-admin/content"
              className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]"
            >
              Back to Content
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Type</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{post.type}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Audience</p>
            <p className="mt-1 text-xl font-black text-[#1b3022]">{post.audience}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Published At</p>
            <p className="mt-1 text-sm font-black text-[#1b3022]">{asDate(post.published_at)}</p>
          </div>
          <div className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">Last Updated</p>
            <p className="mt-1 text-sm font-black text-[#1b3022]">{asDate(post.updated_at || post.created_at)}</p>
          </div>
        </div>
        {isBlog && post.cover_image_url ? (
          <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#d8e0d4] bg-[#f7faf5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image_url} alt={post.title} className="h-64 w-full object-cover" />
          </div>
        ) : null}
      </section>

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
            defaultValue={post.title}
            placeholder="Title"
            className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
          />
          <input
            name="summary"
            defaultValue={post.summary ?? ""}
            placeholder="Summary"
            className="mt-2 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
          />
          <input
            name="link_url"
            defaultValue={post.link_url ?? ""}
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
            defaultValue={post.content}
            placeholder="Content"
            className="mt-2 min-h-64 w-full rounded-xl border border-[#d7ddd3] bg-white px-3 py-3 text-sm font-semibold text-[#1b3022]"
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
            <div className="mt-3 rounded-xl border border-[#e4eae0] bg-[#f5f8f3] p-4">
              {isBlog && post.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.cover_image_url} alt={post.title} className="mb-4 h-44 w-full rounded-xl object-cover" />
              ) : null}
              <p className="text-lg font-black text-[#1b3022]">{post.title}</p>
              <p className="mt-2 text-sm font-semibold text-[#556455]">{asText(post.summary, "No summary")}</p>
              {post.link_url ? <p className="mt-3 break-all text-xs font-bold text-[#6d7c6c]">{post.link_url}</p> : null}
              <p className="mt-3 whitespace-pre-wrap text-sm font-medium text-[#1b3022]">{post.content}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
