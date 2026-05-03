"use client";
// v1.0.3 - Forced HMR refresh - Build: 1777116041

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, BriefcaseBusiness, CircleDollarSign,
  ClipboardList, DoorOpen, Fingerprint, Home, Inbox, LogOut,
  NotebookPen, Settings, Timer, User, Users, Wallet, Bell, Megaphone,
  Bot, CheckCircle2, ChevronRight, Menu, X, Loader2,
} from "lucide-react";
import { type ReactNode, useState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import type { AppRole } from "@/lib/billing-utils";
import { BodhiLogo } from "@/components/branding/bodhi-logo";
import { IndiaTime } from "@/components/layout/india-time";
import { TopLoader } from "@/components/ui/top-loader";

/* ── Nav definitions ─────────────────────────────────────────── */
const superAdminLinks = [
  { href: "/super-admin", label: "Overview", icon: Home },
  { href: "/super-admin/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/super-admin/students", label: "Students", icon: Users },
  { href: "/super-admin/seats", label: "Seats", icon: NotebookPen },
  { href: "/super-admin/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/super-admin/biometrics", label: "Biometric Sync", icon: Fingerprint },
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
  { href: "/student/payments", label: "Payments", icon: CircleDollarSign },
  { href: "/student/notifications", label: "Notifications", icon: Bell },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
  { href: "/student/exams", label: "Exam Alerts", icon: ClipboardList },
  { href: "/student/resources", label: "Resources", icon: BookOpen },
  { href: "/student/profile", label: "My Profile", icon: User },
];

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
  { href: "/student/payments", label: "Pay", icon: CircleDollarSign },
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

/* ── Reusable nav link list ──────────────────────────────────── */
function NavLinks({
  links,
  pathname,
  onLinkClick,
}: {
  links: { href: string; label: string; icon: React.ElementType }[];
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20"
                : "text-[#4e5d4d] hover:bg-[#f0f5ec] hover:text-[#1b3022]"
            } tablet-mini-center`}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-transform duration-150 ${!active ? "group-hover:scale-110" : ""}`} />
            <span className="flex-1 truncate tablet-hide">{link.label}</span>
            {active && <ChevronRight className="h-3 w-3 opacity-50 tablet-hide" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#7d2f2f] transition-all hover:bg-[#f8eef0] active:scale-95 tablet-mini-center disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="tablet-hide">{pending ? "Signing Out..." : "Sign Out"}</span>
    </button>
  );
}

/* ── Sign out button wrapper ───────────────────────────────────── */
function SignOut() {
  return (
    <div className="border-t border-[#e5ebe1] p-2">
      <form action="/auth/signout" method="POST">
        <SignOutButton />
      </form>
    </div>
  );
}

/* ── Main MainLayout ────────────────────────────────────── */
export default function MainLayout({
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
  const [isZenMode, setIsZenMode] = useState(false);

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Detect Zen Mode via body class
  useEffect(() => {
    const checkZen = () => setIsZenMode(document.body.classList.contains("zen-mode-active"));
    checkZen();
    const obs = new MutationObserver(checkZen);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const roleLabel = getRoleLabel(role);

  return (
    <div className="dashboard-root">
      <TopLoader />

      {/* ── DESKTOP SIDEBAR (≥768px always visible) ──────── */}
      {!isZenMode && (
        <aside className="desktop-sidebar">
          <div id="sidebar-header" className="border-b border-[#e5ebe1] px-4 py-4 min-h-[80px]">
            {mounted ? (
              <>
                <BodhiLogo
                  subtitle={roleLabel}
                  subtitleClassName="text-xs tracking-[0.08em] text-[#6b7b69]"
                  className="hidden lg:flex tablet-hide"
                />
                <BodhiLogo miniVariant className="lg:hidden tablet-mini-show" />
                <IndiaTime className="tablet-hide" />
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#f3f7f0] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-[#f3f7f0] rounded animate-pulse" />
                  <div className="h-2 w-16 bg-[#f3f7f0] rounded animate-pulse" />
                </div>
              </div>
            )}
          </div>
          <NavLinks links={links} pathname={pathname} />
          <SignOut />
        </aside>
      )}

      {/* ── LANDSCAPE MINI SIDEBAR (mobile landscape, <768px) */}
      {!isZenMode && (
        <aside className="landscape-sidebar">
          <div className="border-b border-[#e5ebe1] px-3 py-3 min-h-[60px]">
            {mounted ? (
              <BodhiLogo
                markClassName="h-7 w-7 rounded-lg"
                titleClassName="text-sm"
                subtitle={roleLabel}
                subtitleClassName="text-[9px] tracking-[0.06em] text-[#6b7b69]"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-[#f3f7f0] animate-pulse" />
            )}
          </div>
          <NavLinks links={links} pathname={pathname} />
          <SignOut />
        </aside>
      )}

      {/* ── PORTRAIT OVERLAY + DRAWER ──────────────────────── */}
      {drawerOpen && mounted && (
        <div
          className="portrait-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── PORTRAIT SLIDE-IN DRAWER ─────────────────────── */}
      {!isZenMode && (
        <aside className={`portrait-drawer${drawerOpen && mounted ? " open" : ""}`}>
          <div className="flex items-center justify-between border-b border-[#e5ebe1] px-4 py-4 min-h-[80px]">
            {mounted ? (
              <>
                <BodhiLogo
                  subtitle={roleLabel}
                  subtitleClassName="text-xs tracking-[0.08em] text-[#6b7b69]"
                />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e5ebe1] text-[#6b7b69] transition active:scale-90"
                  aria-label="Close menu"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="h-10 w-full rounded-xl bg-[#f3f7f0] animate-pulse" />
            )}
          </div>
          <NavLinks links={links} pathname={pathname} onLinkClick={() => setDrawerOpen(false)} />
          <SignOut />
        </aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="dashboard-main tablet-main-offset">

        {/* Portrait top header */}
        {!isZenMode && (
          <header className="portrait-header">
            {mounted ? (
              <>
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
                    subtitle={roleLabel}
                    subtitleClassName="text-[10px] tracking-[0.08em] text-[#6b7b69]"
                  />
                </div>
                <IndiaTime compact />
              </>
            ) : (
              <div className="h-9 w-full rounded-xl bg-[#f3f7f0] animate-pulse" />
            )}
          </header>
        )}

        {/* Landscape compact header */}
        {!isZenMode && (
          <header className="landscape-header">
            {mounted ? (
              <>
                <BodhiLogo
                  markClassName="h-7 w-7 rounded-lg"
                  titleClassName="text-sm"
                  subtitle={roleLabel}
                  subtitleClassName="text-[9px] tracking-[0.06em] text-[#6b7b69]"
                />
                <IndiaTime compact />
              </>
            ) : (
              <div className="h-7 w-full rounded-lg bg-[#f3f7f0] animate-pulse" />
            )}
          </header>
        )}

        {/* Page content */}
        <div className="dashboard-content">
          {children}
        </div>

        {/* Portrait bottom nav */}
        {!isZenMode && (
          <nav className="bottom-nav" style={{ paddingBottom: "env(safe-area-inset-bottom, 6px)" }}>
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
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-[#1b3022]" />
                    )}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 ${
                      active ? "bg-[#1b3022] text-white shadow-md shadow-[#1b3022]/20" : "text-[#8a9a89]"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-[9px] font-bold leading-none ${active ? "text-[#1b3022]" : "text-[#a0b09f]"}`}>
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
