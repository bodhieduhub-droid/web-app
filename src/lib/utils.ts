import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given date/string to Indian Standard Time (Asia/Kolkata).
 * @param date - Date object or ISO string.
 * @param formatType - 'datetime' for full date & time, 'date' for just date.
 */
export function formatDateToIST(date: string | Date | null | undefined, formatType: "datetime" | "date" = "datetime"): string {
  if (!date) return "";
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  if (formatType === "datetime") {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return d.toLocaleDateString("en-IN", options);
}

/**
 * Optimizes a Cloudinary image URL by adding transformation parameters.
 * @param url - The original Cloudinary URL.
 * @param width - Optional width to resize the image.
 * @returns Optimized URL string.
 */
export function getOptimizedImage(url: string | null | undefined, width: number = 800): string {
  if (!url) return "";
  if (!url.includes("cloudinary.com")) return url;

  // Insert transformations after /upload/
  // f_auto: best format (WebP/AVIF)
  // q_auto: best compression
  // w_xxx: resize to specific width
  const transformation = `upload/f_auto,q_auto,w_${width}/`;
  return url.replace("upload/", transformation);
}
