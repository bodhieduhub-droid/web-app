"use client";

import { useState, useTransition } from "react";
import { Send, User, Phone, Mail, Loader2 } from "lucide-react";

import { submitEnquiry } from "./actions";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await submitEnquiry({ name, phone, email });
      if (result.error) {
        setMessage(result.error);
        return;
      }

      setName("");
      setPhone("");
      setEmail("");
      setMessage("Your enquiry has been sent. Staff will contact you shortly.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white/10 text-white shadow-inner ring-1 ring-white/20">
          <Send className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-serif text-[2.5rem] leading-tight text-white">
            Book your enquiry.
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-white/60">
            Fill this once. Our team will contact you and guide the next step.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Name</label>
          <div className="relative group">
            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 disabled:opacity-50"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Student name"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Phone</label>
          <div className="relative group">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 disabled:opacity-50"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91 9876543210"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Email</label>
          <div className="relative group">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5 disabled:opacity-50"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@email.com"
              type="email"
              required
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {message ? (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-1 ${message.includes("sent") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-red-500/20 bg-red-500/10 text-red-200"}`}>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${message.includes("sent") ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
            <span className={`h-2 w-2 rounded-full ${message.includes("sent") ? "bg-emerald-500" : "bg-red-500"}`} />
          </span>
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="group relative w-full overflow-hidden rounded-2xl bg-white px-5 py-4 text-[13px] font-black uppercase tracking-[0.2em] text-[#0a0f0d] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {isPending ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending...
          </span>
        ) : (
          "Send Enquiry"
        )}
      </button>
    </form>
  );
}
