import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  compress: true,
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    allowedDevOrigins: ["192.168.1.151", "localhost:3000"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        // Immutable cache for hashed static assets (_next/static)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Long cache for public assets (icons, logos, etc.)
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache SVG/PNG/WebP/JPG assets for 1 year (Immutable)
        source: "/:path*.{svg,png,webp,avif,ico,jpg,jpeg}",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
