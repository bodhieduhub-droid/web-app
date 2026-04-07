"use client";

import { useState, useTransition } from "react";

import { submitEnquiry } from "./actions";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.08)]"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#6a7b69]">
          Enquiry Form
        </p>
        <h2 className="font-serif text-4xl leading-tight text-[#1b3022]">
          Book your enquiry.
        </h2>
        <p className="text-sm font-medium leading-6 text-[#576457]">
          Fill this once. Our team will contact you and guide the next step.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Name</span>
          <input
            className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none transition focus:border-[#1b3022]"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Student name"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Phone</span>
          <input
            className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none transition focus:border-[#1b3022]"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 9876543210"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6a7b69]">Email</span>
          <input
            className="w-full rounded-2xl border border-[#d8ddcf] bg-white px-4 py-4 text-sm font-semibold text-[#1b3022] outline-none transition focus:border-[#1b3022]"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@email.com"
            type="email"
          />
        </label>
      </div>

      {message ? (
        <div className="rounded-2xl border border-[#d8ddcf] bg-[#f3f7ef] px-4 py-3 text-sm font-semibold text-[#1b3022]">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[#1b3022] px-5 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}
