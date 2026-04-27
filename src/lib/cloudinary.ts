import "server-only";

import { createHash } from "node:crypto";

interface CloudinaryAsset {
  secureUrl: string;
  publicId: string;
}

function buildSignature(params: Record<string, string>, apiSecret: string): string {
  const serialized = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

// Unsigned upload — uses the upload preset from Cloudinary dashboard
export async function uploadToCloudinary(file: File, folder: string): Promise<CloudinaryAsset> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(60_000), // Allow slower mobile uploads before timing out
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const payload = (await response.json()) as { secure_url: string; public_id: string };
  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

// Signed delete — requires API key + secret (deletion always needs signing)
export async function deleteFromCloudinary(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || !publicId) {
    return { skipped: true as const };
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signature = buildSignature({ public_id: publicId, timestamp }, apiSecret);

  const body = new URLSearchParams();
  body.set("public_id", publicId);
  body.set("timestamp", timestamp);
  body.set("api_key", apiKey);
  body.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary delete failed: ${errorText}`);
  }

  return response.json();
}
