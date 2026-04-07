"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BodhiLogo } from "@/components/branding/bodhi-logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/blogs", label: "Blogs" },
  { href: "/notes", label: "Notes" },
  { href: "/job-opportunities", label: "Jobs" },
  { href: "/contact-us", label: "Contact" },
];

export function MarketingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8e0d4] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <BodhiLogo
          className="transition-transform hover:scale-105"
          markClassName="h-12 w-12 rounded-xl"
          titleClassName="text-xl"
          subtitleClassName="text-[10px] tracking-[0.28em]"
        />
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#4f5f4e]">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl px-4 py-2 transition-all hover:bg-[#f2f6ef] hover:text-[#1b3022]">
              {link.label}
            </Link>
          ))}
          <Link
            href="/register?open=1"
            className="ml-4 rounded-xl bg-[#1b3022] px-5 py-2.5 tracking-[0.2em] text-white transition-all hover:bg-[#27452e] hover:shadow-lg hover:shadow-[#1b3022]/20"
          >
            Enquiry
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2 text-[#1b3022] rounded-xl hover:bg-[#f2f6ef]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-t border-[#d8e0d4] bg-white px-6 py-4 shadow-xl">
          <nav className="flex flex-col gap-4 text-sm font-bold uppercase tracking-[0.2em] text-[#4f5f4e]">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="py-2 hover:text-[#1b3022]"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register?open=1"
              className="mt-2 text-center rounded-xl bg-[#1b3022] px-5 py-3 tracking-[0.2em] text-white"
              onClick={() => setIsOpen(false)}
            >
              Send Enquiry
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
