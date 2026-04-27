import Link from "next/link";
import {
  BookOpen,
  CircleDollarSign,
  Timer,
  User,
} from "lucide-react";

const quickLinks = [
  { href: "/student/study", label: "Study Timer", sub: "Pomodoro focus mode", icon: Timer, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300" },
  { href: "/student/payments", label: "Payments", sub: "Dues & receipts", icon: CircleDollarSign, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300" },
  { href: "/student/resources", label: "Resources", sub: "Notes & job posts", icon: BookOpen, color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300" },
  { href: "/student/profile", label: "My Profile", sub: "Membership & preferences", icon: User, color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300" },
];

export function QuickLinks() {
  return (
    <section>
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Quick Access</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ href, label, sub, icon: Icon, color }) => (
          <Link 
            key={href} 
            href={href} 
            className={`group flex items-center gap-4 rounded-[1.8rem] border p-4 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98] ${color}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/60 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{label}</p>
              <p className="truncate text-[10px] font-medium opacity-70">{sub}</p>
            </div>
            <span className="ml-auto text-sm font-bold opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-40">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
