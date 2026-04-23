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

// Bottom nav — 5 key items for mobile
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

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[#eef3ea] text-[#1b3022] md:flex">
      <TopLoader />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-[#d8e0d4] md:bg-white">
        {/* Logo */}
        <div className="border-b border-[#e5ebe1] px-5 py-5">
          <BodhiLogo
            subtitle={getRoleLabel(role)}
            subtitleClassName="text-xs tracking-[0.08em] text-[#6b7b69]"
          />
          <IndiaTime />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== "/super-admin" && link.href !== "/staff" && link.href !== "/student" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20"
                    : "text-[#4e5d4d] hover:bg-[#f0f5ec] hover:text-[#1b3022]"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${active ? "" : "group-hover:scale-110"}`} />
                <span className="flex-1 truncate">{link.label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-[#e5ebe1] p-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#7d2f2f] transition-all duration-150 hover:bg-[#f8eef0]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MOBILE DRAWER OVERLAY ────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ───────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#e5ebe1] px-5 py-5">
          <BodhiLogo
            subtitle={getRoleLabel(role)}
            subtitleClassName="text-xs tracking-[0.08em] text-[#6b7b69]"
          />
          <button
            onClick={() => setDrawerOpen(false)}
            className="rounded-xl border border-[#e5ebe1] p-2 text-[#6b7b69]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== "/super-admin" && link.href !== "/staff" && link.href !== "/student" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20"
                    : "text-[#4e5d4d] hover:bg-[#f0f5ec]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e5ebe1] p-3">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#7d2f2f] transition-all hover:bg-[#f8eef0]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex min-h-screen flex-1 flex-col pb-20 md:ml-64 md:pb-0">

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#d8e0d4] bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e0d4] text-[#1b3022] active:scale-95 transition-transform"
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

        {/* Page content */}
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6 md:py-8">
          {children}
        </div>

        {/* ── MOBILE BOTTOM NAV ─────────────────────────── */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8e0d4] bg-white/95 px-1 pb-safe backdrop-blur-md md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${bottomLinks.length}, 1fr)` }}
          >
            {bottomLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || (link.href !== "/super-admin" && link.href !== "/staff" && link.href !== "/student" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex flex-col items-center gap-1 py-2 px-1 transition-all active:scale-90"
                >
                  {active && (
                    <span className="absolute top-1 h-1 w-5 rounded-full bg-[#1b3022]" />
                  )}
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    active ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/25" : "text-[#7b8f7a]"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-bold leading-none ${active ? "text-[#1b3022]" : "text-[#9aaa99]"}`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
