import type { PostRecord } from "@/lib/app-types";

export function getPublicPostHref(post: Pick<PostRecord, "type" | "link_url">) {
  if (post.link_url && post.link_url.trim()) return post.link_url.trim();
  if (post.type === "job") return "/job-opportunities";
  if (post.type === "note") return "/notes";
  return "/blogs";
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}
