"use client";

import Image from "next/image";

import { resetAllDataAction, updateHubSettingsAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { HubSettings } from "@/lib/settings";

const remoteImageLoader = ({ src }: { src: string }) => src;

export function SettingsForms({ settings }: { settings: HubSettings }) {
  return (
    <div className="space-y-6">
      <form action={updateHubSettingsAction} className="space-y-6 rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Hub Identity</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="hub_name" defaultValue={settings.hub_name ?? ""} placeholder="Hub name" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="active_vertical" defaultValue={settings.active_vertical ?? ""} placeholder="Active vertical" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="seat_capacity" type="number" min={1} defaultValue={settings.seat_capacity} placeholder="Seat capacity" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Billing Policy</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input name="daily_price" type="number" min={0} step="0.01" defaultValue={settings.daily_price} placeholder="Daily price" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="weekly_price" type="number" min={0} step="0.01" defaultValue={settings.weekly_price} placeholder="Weekly price" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="default_monthly_price" type="number" min={0} step="0.01" defaultValue={settings.default_monthly_price} placeholder="Default monthly price" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="per_day_prorata" type="number" min={0} step="0.01" defaultValue={settings.per_day_prorata} placeholder="Per-day prorata" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="registration_fee" type="number" min={0} step="0.01" defaultValue={settings.registration_fee} placeholder="Registration fee" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="caution_deposit" type="number" min={0} step="0.01" defaultValue={settings.caution_deposit} placeholder="Caution deposit" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Payment Collection</p>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="static_upi_id" defaultValue={settings.static_upi_id ?? ""} placeholder="Static UPI ID" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="static_upi_name" defaultValue={settings.static_upi_name ?? ""} placeholder="Static UPI Name" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022]" />
            <input name="static_upi_qr_url" defaultValue={settings.static_upi_qr_url ?? ""} placeholder="Static UPI QR URL" className="rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] md:col-span-2" />
          </div>
          {settings.static_upi_qr_url ? (
            <div className="rounded-2xl border border-[#d8e0d4] bg-[#f7faf5] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6d7c6c]">UPI QR Preview</p>
              <Image
                loader={remoteImageLoader}
                unoptimized
                src={settings.static_upi_qr_url}
                alt="UPI QR"
                width={208}
                height={208}
                className="mt-3 h-52 w-52 rounded-xl border border-[#d8e0d4] bg-white object-contain p-2"
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Notification Channels</p>
          <div className="grid gap-3 md:grid-cols-2">
            <textarea name="enquiry_notification_emails" defaultValue={settings.enquiry_notification_emails?.join(", ") ?? ""} placeholder="Enquiry emails, comma separated" className="min-h-28 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
            <textarea name="billing_notification_emails" defaultValue={settings.billing_notification_emails?.join(", ") ?? ""} placeholder="Billing emails, comma separated" className="min-h-28 rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-4 text-sm font-semibold text-[#1b3022]" />
          </div>
        </section>

        <PendingSubmitButton
          idleLabel="Save All Settings"
          pendingLabel="Saving..."
          className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-70"
        />
      </form>

      <section className="rounded-[2rem] border border-[#f0d4d4] bg-[#fff8f8] p-6 shadow-lg shadow-[#8a2f2f]/10">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#b45c5c]">Danger Zone</p>
        <h2 className="mt-3 text-2xl font-black text-[#8a2f2f]">Reset All Data</h2>
        <p className="mt-2 text-sm font-semibold text-[#8a2f2f]">
          Deletes enquiries, students, seat assignments, bills, transactions, posts, notifications, and non-admin accounts.
          Settings stay intact. This cannot be undone.
        </p>
        <form action={resetAllDataAction} className="mt-4 space-y-3">
          <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b45c5c]">Type RESET to confirm</span>
            <input
              name="confirm"
              required
              placeholder="RESET"
              className="w-full rounded-2xl border border-[#e4b6b6] bg-white px-4 py-3 text-sm font-semibold text-[#8a2f2f] outline-none transition focus:border-[#8a2f2f]"
            />
          </label>
          <PendingSubmitButton
            idleLabel="Reset All Data"
            pendingLabel="Resetting..."
            className="w-full rounded-2xl bg-[#8a2f2f] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      </section>
    </div>
  );
}
