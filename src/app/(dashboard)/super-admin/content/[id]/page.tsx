import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentEditView } from "@/components/dashboard/content-edit-view";
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

      <ContentEditView post={post} />
    </div>
  );
}
