import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { NavigationProgress } from "@/components/navigation-progress";
import { TooltipProvider } from "@/components/ui/tooltip";
// ssr:false dynamic imports must live in a 'use client' module
import {
  LeadChatbotLazy as LeadChatbot,
  PwaInstallBannerLazy as PwaInstallBanner,
} from "@/components/marketing/lazy-client-components";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bodhi Edu Hub | Reading Hub",
  description:
    "Bodhi Edu Hub Reading Hub manages enquiries, monthly student onboarding, manual UPI billing, public notes, and job opportunities.",
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://bodhieduhub.com",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bodhi Edu Hub",
  },
  icons: {
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b3022",
  width: "device-width",
  initialScale: 1,
  // Allow free rotation — portrait + landscape both work
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Resource hints — resolve font CDN before browser discovers stylesheet */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* PWA meta tags */}
        <meta name="application-name" content="Bodhi Edu Hub" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Bodhi" />
        <meta name="msapplication-TileColor" content="#1b3022" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
          {/* These load after the page is interactive — never block first paint */}
          <LeadChatbot />
          <PwaInstallBanner />
        </TooltipProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // PWA disabled — actively kill any leftover service worker + caches
              // from previous deployments so users don't get stuck on stale assets.
              (function () {
                var cleanupFlag = "bodhi_sw_cleanup_done_v1";
                var shouldReload = sessionStorage.getItem(cleanupFlag) !== "1";
                var tasks = [];

                if ('serviceWorker' in navigator) {
                  tasks.push(
                    navigator.serviceWorker.getRegistrations().then(function (regs) {
                      return Promise.all(regs.map(function (r) { return r.unregister(); }));
                    })
                  );
                }

                if (typeof caches !== 'undefined') {
                  tasks.push(
                    caches.keys().then(function (keys) {
                      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
                    })
                  );
                }

                Promise.all(tasks).then(function (results) {
                  // Only reload if we actually found something to clean up
                  var swRegs = results[0] || [];
                  var cacheKeys = results[1] || [];
                  var didCleanup = swRegs.length > 0 || cacheKeys.length > 0;

                  if (shouldReload && didCleanup) {
                    sessionStorage.setItem(cleanupFlag, "1");
                    window.location.reload();
                  } else if (shouldReload) {
                    // Mark as done even if no cleanup was needed, to avoid checking every time
                    sessionStorage.setItem(cleanupFlag, "1");
                  }
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
