"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, BookOpen, BriefcaseBusiness, CalendarDays, CircleDollarSign,
  ClipboardList, DoorOpen, GraduationCap, Home, Inbox, LogOut,
  Megaphone, NotebookPen, Settings, Timer, User, Users, Wallet,
  Bot, CheckCircle2, ChevronRight, Menu, X,
} from "lucide-react";
import { type ReactNode, useState, useEffect } from "react";

import type { AppRole } from "@/lib/billing-utils";
import { BodhiLogo } from "@/components/branding/bodhi-logo";
import { IndiaTime } from "@/components/layout/india-time";
import { TopLoader } from "@/components/ui/top-loader";

/* ── Nav definitions ────────────────────────────────── */
const superAdminLinks = [
  { href: "/super-admin", label: "Overview", icon: Home },
  { href: "/super-admin/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/super-admin/students", label: "Students", icon: Users },
  { href: "/super-admin/seats", label: "Seats", icon: NotebookPen },
  { href: "/super-admin/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/super-admin/night-logs", label: "Night Logs", icon: Timer },
  { href: "/super-admin/billing", label: "Billing", icon: CircleDollarSign },
  { href: "/super-admin/expenses", label: "Expenses", icon: Wallet },
  { href: "/super-admin/exit-requests", label: "Exit Requests", icon: DoorOpen },
  { href: "/super-admin/content", label: "Content", icon: BriefcaseBusiness },
  { href: "/super-admin/support", label: "Support", icon: Inbox },
  { href: "/super-admin/staff", label: "Staff", icon: Users },
  { href: "/super-admin/chatbot", label: "Bhanu AI", icon: Bot },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

const staffLinks = [
  { href: "/staff", label: "Overview", icon: Home },
  { href: "/staff/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/staff/students", label: "Students", icon: Users },
  { href: "/staff/seats", label: "Seats", icon: NotebookPen },
  { href: "/staff/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/staff/billing", label: "Billing", icon: CircleDollarSign },
  { href: "/staff/expenses", label: "Expenses", icon: Wallet },
  { href: "/staff/content", label: "Content", icon: BriefcaseBusiness },
  { href: "/staff/support", label: "Support", icon: Inbox },
  { href: "/staff/exit-requests", label: "Exit Requests", icon: DoorOpen },
];

const studentLinks = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/study", label: "Study Timer", icon: Timer },
  { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/student/resources", label: "Resources", icon: BookOpen },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
  { href: "/student/exams", label: "Exam Alerts", icon: GraduationCap },
  { href: "/student/payments", label: "Payments", icon: Wallet },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/profile", label: "My Profile", icon: User },
];

// Bottom nav — 5 core items for portrait mode
const superAdminBottomLinks = [
  { href: "/super-admin", label: "Home", icon: Home },
  { href: "/super-admin/students", label: "Students", icon: Users },
  { href: "/super-admin/billing", label: "Billing", icon: CircleDollarSign },
  { href: "/super-admin/attendance", label: "Attend", icon: CheckCircle2 },
  { href: "/super-admin/chatbot", label: "AI", icon: Bot },
];

const staffBottomLinks = [
  { href: "/staff", label: "Home", icon: Home },
  { href: "/staff/students", label: "Students", icon: Users },
  { href: "/staff/billing", label: "Billing", icon: CircleDollarSign },
  { href: "/staff/seats", label: "Seats", icon: NotebookPen },
  { href: "/staff/support", label: "Support", icon: Inbox },
];

const studentBottomLinks = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/study", label: "Study", icon: Timer },
  { href: "/student/payments", label: "Pay", icon: Wallet },
  { href: "/student/notifications", label: "Inbox", icon: Bell },
  { href: "/student/profile", label: "Profile", icon: User },
];

function getLinks(role: AppRole) {
  if (role === "super_admin") return superAdminLinks;
  if (role === "staff") return staffLinks;
  return studentLinks;
}

function getBottomLinks(role: AppRole) {
  if (role === "super_admin") return superAdminBottomLinks;
  if (role === "staff") return staffBottomLinks;
  return studentBottomLinks;
}

function getRoleLabel(role: AppRole) {
  if (role === "super_admin") return "Super Admin";
  if (role === "staff") return "Staff";
  return "Student Portal";
}

function isActive(linkHref: string, pathname: string) {
  const roots = ["/super-admin", "/staff", "/student"];
  if (roots.includes(linkHref)) return pathname === linkHref;
  return pathname.startsWith(linkHref);
}

/* ── Sidebar (shared between desktop & mobile drawer) ─ */
function Sidebar({
  role,
  links,
  pathname,
  onClose,
}: {
  role: AppRole;
  links: typeof superAdminLinks;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5ebe1] px-4 py-4">
        <BodhiLogo
          subtitle={getRoleLabel(role)}
          subtitleClassName="text-xs tracking-[0.08em] text-[#6b7b69]"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e5ebe1] text-[#6b7b69] transition active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Time — only shown without close button (desktop/landscape) */}
      {!onClose && (
        <div className="border-b border-[#f0f5ec] px-4 py-2">
          <IndiaTime />
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                active
                  ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20"
                  : "text-[#4e5d4d] hover:bg-[#f0f5ec] hover:text-[#1b3022]"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${!active ? "group-hover:scale-110" : ""}`} />
              <span className="flex-1 truncate">{link.label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-[#e5ebe1] p-2">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#7d2f2f] transition-all hover:bg-[#f8eef0] active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Layout ─────────────────────────────────────── */
export function DashboardLayout({
  children,
  role,
}: {
  children: ReactNode;
  role: AppRole;
}) {
  const pathname = usePathname();
  const links = getLinks(role);
  const bottomLinks = getBottomLinks(role);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detect orientation changes
  useEffect(() => {
    function update() {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", () => setTimeout(update, 100));
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", () => setTimeout(update, 100));
    };
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // In landscape on small screen — show a mini sidebar instead of bottom nav
  const showLandscapeSidebar = isLandscape;

  return (
    <div className="min-h-dvh bg-[#eef3ea] text-[#1b3022] md:flex">
      <TopLoader />

      {/* ── DESKTOP SIDEBAR (md+) ───────────────────────── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r md:border-[#d8e0d4] md:bg-white md:shadow-sm">
        <Sidebar role={role} links={links} pathname={pathname} />
      </aside>

      {/* ── LANDSCAPE MINI SIDEBAR (mobile landscape) ───── */}
      {showLandscapeSidebar && (
        <>
          <aside className="fixed inset-y-0 left-0 z-20 flex w-52 flex-col border-r border-[#d8e0d4] bg-white shadow-sm md:hidden">
            <Sidebar role={role} links={links} pathname={pathname} />
          </aside>
          {/* Content offset for landscape sidebar */}
        </>
      )}

      {/* ── MOBILE DRAWER OVERLAY ────────────────────────── */}
      {drawerOpen && !showLandscapeSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER (portrait only) ────────────────── */}
      {!showLandscapeSidebar && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            role={role}
            links={links}
            pathname={pathname}
            onClose={() => setDrawerOpen(false)}
          />
        </aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main
        className={`flex min-h-dvh flex-1 flex-col transition-all duration-300 ${
          showLandscapeSidebar ? "ml-52" : "md:ml-60"
        }`}
        // Add bottom padding only in portrait (bottom nav visible)
        style={{
          paddingBottom: showLandscapeSidebar ? 0 : undefined,
        }}
      >
        {/* Mobile portrait top bar */}
        {!showLandscapeSidebar && (
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#d8e0d4] bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e0d4] text-[#1b3022] transition active:scale-90"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <BodhiLogo
                markClassName="h-8 w-8 rounded-lg"
                titleClassName="text-base"
                subtitle={getRoleLabel(role)}
                subtitleClassName="text-[10px] tracking-[0.08em] text-[#6b7b69]"
              />
            </div>
            <IndiaTime compact />
          </header>
        )}

        {/* Landscape top bar — minimal, just shows current page hint */}
        {showLandscapeSidebar && (
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8e0d4] bg-white/95 px-4 py-2 backdrop-blur-md md:hidden">
            <BodhiLogo
              markClassName="h-7 w-7 rounded-lg"
              titleClassName="text-sm"
              subtitle={getRoleLabel(role)}
              subtitleClassName="text-[9px] tracking-[0.08em] text-[#6b7b69]"
            />
            <IndiaTime compact />
          </header>
        )}

        {/* Page content */}
        <div className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 md:px-6 md:py-8">
          {children}
        </div>

        {/* ── PORTRAIT BOTTOM NAV (hidden in landscape + desktop) */}
        {!showLandscapeSidebar && (
          <nav
            className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8e0d4] bg-white/95 backdrop-blur-md md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}
          >
            <div
              className="grid px-1 pt-1"
              style={{ gridTemplateColumns: `repeat(${bottomLinks.length}, 1fr)` }}
            >
              {bottomLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href, pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative flex flex-col items-center gap-0.5 px-1 py-1.5 transition-all active:scale-90"
                  >
                    {/* Active dot */}
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-[#1b3022]" />
                    )}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 ${
                        active
                          ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20"
                          : "text-[#8a9a89]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[9px] font-bold leading-none ${
                        active ? "text-[#1b3022]" : "text-[#a0b09f]"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </main>

      {/* Global styles injected once */}
      <style jsx global>{`
        /* Portrait: pad content above bottom nav */
        @media (max-width: 767px) and (orientation: portrait) {
          main {
            padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
          }
        }
        /* Landscape on small screen: no bottom nav padding needed */
        @media (max-width: 1023px) and (orientation: landscape) {
          main {
            padding-bottom: 0 !important;
          }
        }
        /* Full height on all devices */
        html, body {
          height: 100%;
          min-height: 100dvh;
        }
      `}</style>
    </div>
  );
}
