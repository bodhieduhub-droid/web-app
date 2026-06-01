import type { PostRecord } from "@/lib/app-types";

export function createSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

export function getPublicPostHref(post: Pick<PostRecord, "id" | "type" | "link_url" | "title">) {
  const url = (post.link_url || "").trim();
  
  // If it's a valid external URL, use it
  if (/^https?:\/\//i.test(url)) return url;
  
  // If it's a relative path starting with /, use it
  if (url.startsWith("/")) return url;
  
  const slug = createSlug(post.title || "post");

  // Format: /[type]/[id]/[slug]
  if (post.type === "job") return `/job-opportunities/${post.id}/${slug}`;
  if (post.type === "blog") return `/blogs/${post.id}/${slug}`;
  if (post.type === "note") return "/notes";
  
  return "/blogs";
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
