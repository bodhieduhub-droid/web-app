"use client";

import { useState, useTransition } from "react";
import { Send, User, Phone, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitEnquiry } from "./actions";
import { enquirySchema, type EnquiryInput } from "./schemas";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      phone: "+91 ",
      email: "",
    },
  });

  const onSubmit = (data: EnquiryInput) => {
    setMessage(null);
    startTransition(async () => {
      const result = await submitEnquiry(data);
      if (result.error) {
        setMessage({ text: result.error, type: "error" });
        return;
      }

      reset({ name: "", phone: "+91 ", email: "" });
      setMessage({ text: "Your enquiry has been sent. Staff will contact you shortly.", type: "success" });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Name</label>
            {errors.name && (
              <span className="text-[10px] font-bold text-red-400 animate-in fade-in slide-in-from-right-1">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="relative group">
            <User className={cn(
              "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
              errors.name ? "text-red-400/50 group-focus-within:text-red-400" : "text-white/40 group-focus-within:text-white"
            )} />
            <input
              {...register("name")}
              className={cn(
                "w-full rounded-2xl border bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-4 disabled:opacity-50",
                errors.name 
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                  : "border-white/10 focus:border-white/30 focus:ring-white/5"
              )}
              placeholder="Student name"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Phone</label>
            {errors.phone && (
              <span className="text-[10px] font-bold text-red-400 animate-in fade-in slide-in-from-right-1">
                {errors.phone.message}
              </span>
            )}
          </div>
          <div className="relative group">
            <Phone className={cn(
              "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
              errors.phone ? "text-red-400/50 group-focus-within:text-red-400" : "text-white/40 group-focus-within:text-white"
            )} />
            <input
              {...register("phone")}
              className={cn(
                "w-full rounded-2xl border bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-4 disabled:opacity-50",
                errors.phone 
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                  : "border-white/10 focus:border-white/30 focus:ring-white/5"
              )}
              placeholder="+91 9876543210"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/50">Email</label>
            {errors.email && (
              <span className="text-[10px] font-bold text-red-400 animate-in fade-in slide-in-from-right-1">
                {errors.email.message}
              </span>
            )}
          </div>
          <div className="relative group">
            <Mail className={cn(
              "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors",
              errors.email ? "text-red-400/50 group-focus-within:text-red-400" : "text-white/40 group-focus-within:text-white"
            )} />
            <input
              {...register("email")}
              className={cn(
                "w-full rounded-2xl border bg-white/5 px-12 py-4 text-[15px] font-medium text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-4 disabled:opacity-50",
                errors.email 
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
                  : "border-white/10 focus:border-white/30 focus:ring-white/5"
              )}
              placeholder="student@email.com"
              type="email"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {message ? (
        <div className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium backdrop-blur-md animate-in fade-in slide-in-from-top-1",
          message.type === "success" 
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" 
            : "border-red-500/20 bg-red-500/10 text-red-200"
        )}>
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          {message.text}
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

