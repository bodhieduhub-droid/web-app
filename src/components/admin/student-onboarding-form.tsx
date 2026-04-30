"use client";

import { useState } from "react";
import { onboardStudentAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { HubSettings } from "@/lib/settings";

interface SeatOption {
  id: string;
  seat_number: number;
  status: string;
}

export function StudentOnboardingForm({
  seats,
  settings,
  backUrl,
}: {
  seats: SeatOption[];
  settings: HubSettings;
  backUrl: string;
}) {
  const [planType, setPlanType] = useState<string>("monthly");

  const isQuickEntry = planType === "daily" || planType === "weekly";

  return (
    <form action={onboardStudentAction} className="space-y-8 rounded-[2rem] border border-[#d8e0d4] bg-white p-8 shadow-xl shadow-[#27452e]/6">
      {/* Plan & Seat Selection - MOVED TO TOP for context */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-[#1b3022] flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b3022] text-[10px] text-white">1</span>
          Plan & Assignment
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Reader Type</label>
            <select
              name="reader_type"
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            >
              <option value="monthly">Monthly Plan</option>
              <option value="weekly">Weekly Plan</option>
              <option value="daily">Daily Plan</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">
              {planType === "monthly" ? "Monthly Fee" : planType === "weekly" ? "Weekly Fee" : "Daily Fee"} (₹)
            </label>
            <input
              name="monthly_fee"
              type="number"
              placeholder={
                planType === "monthly" 
                  ? settings.default_monthly_price.toString() 
                  : planType === "weekly" ? "500" : "100"
              }
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Assign Seat</label>
            <select
              name="seat_id"
              required
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            >
              <option value="">Select an available seat</option>
              {seats?.map((seat) => (
                <option key={seat.id} value={seat.id}>
                  Seat {seat.seat_number} ({seat.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <hr className="border-[#eef3ea]" />

      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-[#1b3022] flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b3022] text-[10px] text-white">2</span>
          Basic Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Full Name</label>
            <input
              name="name"
              required
              placeholder="Student's full name"
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Phone Number</label>
            <input
              name="phone"
              required
              placeholder="Primary contact number"
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Biometric ID (eSSL)</label>
            <input
              name="biometric_id"
              placeholder="Machine User ID (e.g. 101)"
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            />
            <p className="text-[10px] text-[#6d7c6c] ml-1 italic">Used for automated fingerprint attendance.</p>
          </div>
          
          {!isQuickEntry && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Email (Optional)</label>
                <input
                  name="email"
                  type="email"
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
                />
                <p className="text-[10px] text-[#6d7c6c] ml-1 italic">If provided, credentials will be sent to this email.</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Join Date</label>
            <input
              name="join_date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
            />
          </div>
        </div>
      </section>

      {!isQuickEntry && (
        <>
          <hr className="border-[#eef3ea]" />

          {/* Additional Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#1b3022] flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b3022] text-[10px] text-white">3</span>
              Additional Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Full Address</label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Permanent or current address"
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Purpose of Visit</label>
                <input
                  name="purpose"
                  placeholder="e.g. UPSC Preparation, Self Study"
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Preparing for Exam?</label>
                  <select
                    name="preparing_for_exam"
                    className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">Exam Details</label>
                  <input
                    name="exam_details"
                    placeholder="e.g. UPSC CSE 2024"
                    className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] focus:outline-none focus:ring-2 focus:ring-[#1b3022]/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d7c6c] ml-1">ID Proof (Optional)</label>
                <input
                  name="id_proof"
                  type="file"
                  accept="image/*"
                  className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] file:mr-4 file:rounded-full file:border-0 file:bg-[#1b3022] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#27452e]"
                />
                <p className="text-[10px] text-[#6d7c6c] ml-1 italic">
                  Upload a clear photo of Aadhar, PAN, or any Gov ID. 
                  <br />
                  <strong>Note:</strong> If you don&apos;t upload an ID proof now, the student will be asked to upload it when they first log in.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="pt-4">
        <PendingSubmitButton
          idleLabel={isQuickEntry ? `Add ${planType === 'daily' ? 'Daily' : 'Weekly'} Student` : "Onboard Student"}
          pendingLabel="Processing..."
          className="w-full rounded-2xl bg-[#1b3022] py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-[#1b3022]/20 transition hover:bg-[#27452e]"
        />
      </div>
    </form>
  );
}
