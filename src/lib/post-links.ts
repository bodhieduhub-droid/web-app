import type { PostRecord } from "@/lib/app-types";

export function getPublicPostHref(post: Pick<PostRecord, "id" | "type" | "link_url">) {
  const url = (post.link_url || "").trim();
  
  // If it's a valid external URL, use it
  if (/^https?:\/\//i.test(url)) return url;
  
  // If it's a relative path starting with /, use it
  if (url.startsWith("/")) return url;
  
  // If it's not empty but not a valid URL (like "file.pdf" or "some string"), 
  // we could try to treat it as a detail page if we have one, 
  // or just return the list if it's a job.
  if (post.type === "job") return `/job-opportunities/${post.id}`;
  if (post.type === "blog") return `/blogs/${post.id}`;
  if (post.type === "note") return "/notes";
  
  return "/blogs";
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
