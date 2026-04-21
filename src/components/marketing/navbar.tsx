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
    <header className="sticky top-0 z-50 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <BodhiLogo
          className="transition-transform hover:scale-105"
          markClassName="h-12 w-12 rounded-xl"
          titleClassName="text-xl"
          subtitleClassName="text-[10px] tracking-[0.28em]"
        />
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="relative text-sm font-medium text-[#4f5f4e] transition-colors hover:text-[#1b3022] group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#1b3022] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          <div className="flex items-center gap-3 pl-6 border-l border-[#d8e0d4]">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold text-[#4f5f4e] rounded-full border border-[#d8e0d4] transition-all hover:border-[#1b3022] hover:text-[#1b3022]"
            >
              Login
            </Link>
            <Link
              href="/register?open=1"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#1b3022] rounded-full transition-all hover:bg-[#2d4a35] hover:shadow-lg hover:shadow-[#1b3022]/25 hover:-translate-y-0.5"
            >
              Enquiry
            </Link>
          </div>
        </nav>

        {/* Mobile menu button */}
        <button 
          className="lg:hidden p-2.5 text-[#1b3022] rounded-full bg-[#f2f6ef] hover:bg-[#e8efe5] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-t border-[#d8e0d4] bg-white/95 backdrop-blur-lg">
          <nav className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="px-4 py-3 text-[15px] font-medium text-[#4f5f4e] rounded-xl hover:bg-[#f2f6ef] hover:text-[#1b3022] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#d8e0d4] my-2" />
            <Link
              href="/login"
              className="px-4 py-3 text-[15px] font-medium text-[#4f5f4e] rounded-xl hover:bg-[#f2f6ef] hover:text-[#1b3022] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register?open=1"
              className="mx-4 mt-2 text-center text-sm font-semibold text-white bg-[#1b3022] rounded-full px-5 py-3.5 hover:bg-[#2d4a35] transition-colors"
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
