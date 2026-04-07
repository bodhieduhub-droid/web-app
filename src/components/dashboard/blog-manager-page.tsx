import { createBlogPostAction } from "@/app/(dashboard)/actions";
import { BlogTextEditor } from "@/components/dashboard/blog-text-editor";
import type { PostRecord } from "@/lib/app-types";

type PostRow = PostRecord & {
  created_at?: string;
  updated_at?: string;
};

function ManagerList({
  rows,
  detailBasePath,
}: {
  rows: PostRow[];
  detailBasePath?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-[#d8e0d4] bg-white shadow-lg shadow-[#27452e]/6">
      <div className="divide-y divide-[#e4eae0]">
        {rows.length > 0 ? (
          rows.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-black text-[#1b3022]">{post.title}</p>
                <p className="mt-1 text-xs font-semibold text-[#6d7c6c]">
                  {post.status} · {post.audience}
                </p>
              </div>
              {detailBasePath ? (
                <a href={`${detailBasePath}/${post.id}`} className="rounded-xl border border-[#d8e0d4] bg-white px-3 py-2 text-xs font-black text-[#1b3022]">
                  Manage
                </a>
              ) : null}
            </div>
          ))
        ) : (
          <p className="px-5 py-8 text-sm font-semibold text-[#6d7c6c]">No blogs yet.</p>
        )}
      </div>
    </div>
  );
}

export function BlogManagerPage({
  rows,
  detailBasePath,
}: {
  rows: PostRow[];
  detailBasePath?: string;
}) {
  const blogRows = rows.filter((post) => post.type === "blog");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Blog Manager</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">Create And Manage Blogs</h1>
      </section>

      <form action={createBlogPostAction} className="grid gap-3 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input name="title" placeholder="Blog title" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          <select name="status" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]">
            <option value="draft">Draft</option>
            <option value="published">Publish now</option>
          </select>
        </div>
        <input name="summary" placeholder="Short summary" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="link_url" placeholder="External article link (optional)" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <input name="cover_image" type="file" accept="image/*" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
        <BlogTextEditor submitIdleLabel="Create Blog" submitPendingLabel="Publishing..." />
      </form>

      <ManagerList rows={blogRows} detailBasePath={detailBasePath} />
    </div>
  );
}
