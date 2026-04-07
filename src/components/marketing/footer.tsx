import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { BodhiLogo } from "@/components/branding/bodhi-logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#d8e0d4] bg-white pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-8">
          
          {/* Brand Info */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <BodhiLogo />
            <p className="text-sm font-medium leading-6 text-[#556455] max-w-sm">
              Your ultimate destination for focused preparation. We provide an unparalleled environment for serious competitive exam aspirants.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f6ef] text-[#1b3022] transition-colors hover:bg-[#1b3022] hover:text-white">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f6ef] text-[#1b3022] transition-colors hover:bg-[#1b3022] hover:text-white">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f6ef] text-[#1b3022] transition-colors hover:bg-[#1b3022] hover:text-white">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f6ef] text-[#1b3022] transition-colors hover:bg-[#1b3022] hover:text-white">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]">Quick Links</h3>
            <ul className="space-y-4 text-sm font-medium text-[#4f5f4e]">
              <li><Link href="/" className="transition-colors hover:text-[#1b3022]">Home</Link></li>
              <li><Link href="/services" className="transition-colors hover:text-[#1b3022]">Services</Link></li>
              <li><Link href="/testimonials" className="transition-colors hover:text-[#1b3022]">Testimonials</Link></li>
              <li><Link href="/blogs" className="transition-colors hover:text-[#1b3022]">Blogs</Link></li>
              <li><Link href="/contact-us" className="transition-colors hover:text-[#1b3022]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]">Resources</h3>
            <ul className="space-y-4 text-sm font-medium text-[#4f5f4e]">
              <li><Link href="/notes" className="transition-colors hover:text-[#1b3022]">Study Notes</Link></li>
              <li><Link href="/job-opportunities" className="transition-colors hover:text-[#1b3022]">Job Opportunities</Link></li>
              <li><Link href="/register?open=1" className="transition-colors hover:text-[#1b3022]">Seat Enquiry</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-[#1b3022]">Student Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#1b3022]">Contact</h3>
            <ul className="space-y-4 text-sm font-medium text-[#4f5f4e]">
              <li className="flex gap-3">
                <MapPin size={18} className="shrink-0 text-[#1b3022]" />
                <span>Bakery Junction, Vazhuthacaud, Thiruvananthapuram</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#1b3022]" />
                <span>080896 95014</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#1b3022]" />
                <span>ops@bodhieduhub.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-[#d8e0d4] pt-8 md:flex-row">
          <p className="text-xs font-semibold text-[#6a7b69]">
            © {new Date().getFullYear()} Bodhi Edu Hub. All rights reserved.
          </p>
          <div className="mt-4 flex gap-6 text-xs font-semibold text-[#6a7b69] md:mt-0">
            <Link href="#" className="transition-colors hover:text-[#1b3022]">Privacy Policy</Link>
            <Link href="#" className="transition-colors hover:text-[#1b3022]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
