"use client";

import dynamic from "next/dynamic";

// Both components are heavy client-side-only UI.
// Wrapping them here (in a "use client" module) is required because
// next/dynamic with ssr:false cannot be used in Server Components (layout.tsx).
export const LeadChatbotLazy = dynamic(
  () =>
    import("@/components/marketing/lead-chatbot").then((m) => m.LeadChatbot),
  { ssr: false, loading: () => null }
);

export const PwaInstallBannerLazy = dynamic(
  () =>
    import("@/components/pwa-install-banner").then((m) => m.PwaInstallBanner),
  { ssr: false, loading: () => null }
);
