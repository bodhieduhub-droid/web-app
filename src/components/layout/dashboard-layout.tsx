"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, BriefcaseBusiness, CalendarDays, CircleDollarSign, ClipboardList, DoorOpen, GraduationCap, Home, Inbox, LogOut, Megaphone, NotebookPen, Settings, Timer, User, Users, Wallet, Bot } from "lucide-react";
import { type ReactNode } from "react";

import type { AppRole } from "@/lib/billing-utils";
import { BodhiLogo } from "@/components/branding/bodhi-logo";
import { IndiaTime } from "@/components/layout/india-time";
import { TopLoader } from "@/components/ui/top-loader";

const superAdminLinks = [
  { href: "/super-admin", label: "Overview", icon: Home },
  { href: "/super-admin/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/super-admin/students", label: "Students", icon: Users },
  { href: "/super-admin/seats", label: "Seats", icon: NotebookPen },
  { href: "/super-admin/night-logs", label: "Night Logs", icon: Timer },
  { href: "/super-admin/billing", label: "Billing", icon: CircleDollarSign },
  { href: "/super-admin/content", label: "Content", icon: BriefcaseBusiness },
  { href: "/super-admin/support", label: "Support", icon: Inbox },
  { href: "/super-admin/staff", label: "Staff", icon: Users },
  { href: "/super-admin/chatbot", label: "Bhanu AI", icon: Bot },
  { href: "/super-admin/exit-requests", label: "Exit Requests", icon: DoorOpen },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

const staffLinks = [
  { href: "/staff", label: "Overview", icon: Home },
  { href: "/staff/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/staff/students", label: "Students", icon: Users },
  { href: "/staff/seats", label: "Seats", icon: NotebookPen },
  { href: "/staff/billing", label: "Billing", icon: CircleDollarSign },
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

function getLinks(role: AppRole) {
  if (role === "super_admin") return superAdminLinks;
  if (role === "staff") return staffLinks;
  return studentLinks;
}

function getMobileLinks(role: AppRole) {
  if (role === "super_admin") {
    return [
      { href: "/super-admin", label: "Home", icon: Home },
      { href: "/super-admin/students", label: "Students", icon: Users },
      { href: "/super-admin/billing", label: "Billing", icon: CircleDollarSign },
      { href: "/super-admin/content", label: "Content", icon: BriefcaseBusiness },
      { href: "/super-admin/chatbot", label: "AI Hub", icon: Bot },
      { href: "/super-admin/support", label: "Support", icon: Inbox },
      { href: "/super-admin/settings", label: "Settings", icon: Settings },
    ];
  }
  if (role === "staff") {
    return [
      { href: "/staff", label: "Home", icon: Home },
      { href: "/staff/students", label: "Students", icon: Users },
      { href: "/staff/billing", label: "Billing", icon: CircleDollarSign },
      { href: "/staff/content", label: "Content", icon: BriefcaseBusiness },
      { href: "/staff/support", label: "Support", icon: Inbox },
      { href: "/staff/seats", label: "Seats", icon: NotebookPen },
    ];
  }
  return [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/study", label: "Study", icon: Timer },
    { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/student/payments", label: "Pay", icon: Wallet },
    { href: "/student/notifications", label: "Inbox", icon: Bell },
    { href: "/student/profile", label: "Profile", icon: User },
  ];
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
  const mobileLinks = getMobileLinks(role);

  return (
    <div className="min-h-screen bg-[#eef3ea] text-[#1b3022] md:flex">
      <TopLoader />
      <aside className="hidden w-72 shrink-0 border-r border-[#d8e0d4] bg-white md:fixed md:inset-y-0 md:left-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        <div className="border-b border-[#e5ebe1] px-6 py-6">
          <BodhiLogo
            subtitle={role === "student" ? "Student Portal" : role === "staff" ? "Staff Operations" : "Super Admin"}
            subtitleClassName="text-sm tracking-[0.08em] text-[#6b7b69]"
          />
          <IndiaTime />
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active ? "bg-[#1b3022] text-white shadow-lg shadow-[#1b3022]/15" : "text-[#4e5d4d] hover:bg-[#f3f7f0]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e5ebe1] p-4 md:sticky md:bottom-0 md:bg-white">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8e0d4] px-4 py-3 text-sm font-bold text-[#1b3022] transition hover:bg-[#f3f7f0]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-h-screen flex-1 pb-24 md:ml-72 md:max-h-screen md:overflow-y-auto md:pb-0">
        <header className="sticky top-0 z-20 border-b border-[#d8e0d4] bg-white/90 px-6 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <BodhiLogo
                markClassName="h-10 w-10 rounded-xl"
                titleClassName="text-lg"
                subtitle={role === "student" ? "Student" : role === "staff" ? "Staff" : "Super Admin"}
                subtitleClassName="text-sm tracking-[0.08em] text-[#6b7b69]"
              />
              <IndiaTime compact />
            </div>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="rounded-2xl border border-[#d8e0d4] px-4 py-2 text-sm font-bold">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-[#d8e0d4] bg-white/95 px-2 py-2 backdrop-blur md:hidden"
          style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}
        >
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-sm font-semibold ${active ? "bg-[#1b3022] text-white" : "text-[#536352]"}`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
