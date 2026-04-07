import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { LeadChatbot } from "@/components/marketing/lead-chatbot";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bodhi Edu Hub | Reading Hub",
  description:
    "Bodhi Edu Hub Reading Hub manages enquiries, monthly student onboarding, manual UPI billing, public notes, and job opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          {children}
          <LeadChatbot />
        </TooltipProvider>
      </body>
    </html>
  );
}
