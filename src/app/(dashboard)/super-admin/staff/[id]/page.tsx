import Link from "next/link";
import { notFound } from "next/navigation";

import {
  removeStaffAccountAction,
  updateStaffProfileAction,
} from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { id: string };

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN");
}

export default async function SuperAdminStaffDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const context = await requireDashboardContext(["super_admin"]);
  const { id } = await params;
  const supabase = createAdminClient();

  const [profileRes, enquiryCountRes, blockedCountRes, verifyCountRes, postCountRes, enquiriesRes, seatsRes, txRes, postsRes, notifRes] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, role, created_at").eq("id", id).maybeSingle(),
      supabase
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", id)
        .in("status", ["new", "contacted", "seat_blocked"]),
      supabase
        .from("seats")
        .select("id", { count: "exact", head: true })
        .eq("blocked_by_profile_id", id)
        .eq("status", "blocked"),
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("verified_by_profile_id", id)
        .in("verification_status", ["verified", "rejected", "closed"]),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_profile_id", id),
      supabase
        .from("enquiries")
        .select("id, name, phone, status, created_at")
        .eq("assigned_to", id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("seats")
        .select("id, seat_number, block_reason, updated_at")
        .eq("blocked_by_profile_id", id)
        .eq("status", "blocked")
        .order("seat_number", { ascending: true })
        .limit(12),
      supabase
        .from("transactions")
        .select("id, amount, verification_status, verification_notes, submitted_at, readers(name), bills(title)")
        .eq("verified_by_profile_id", id)
        .order("submitted_at", { ascending: false })
        .limit(12),
      supabase
        .from("posts")
        .select("id, title, type, status, created_at")
        .eq("author_profile_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("notifications")
        .select("id, title, category, created_at, read_at")
        .eq("audience_type", "profile")
        .eq("audience_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  if (!profileRes.data) notFound();

  const staff = profileRes.data as {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
  };

  const totalAssigned = enquiryCountRes.count ?? 0;
  const totalBlockedSeats = blockedCountRes.count ?? 0;
  const totalVerified = verifyCountRes.count ?? 0;
  const totalPosts = postCountRes.count ?? 0;
  const unreadNotifications = (notifRes.data ?? []).filter((item) => !item.read_at).length;

  const canDelete = context.profile.id !== staff.id && staff.role === "staff";

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Staff Detail</p>
            <h1 className="mt-3 text-4xl font-black text-[#1b3022]">{staff.full_name || "Staff Member"}</h1>
            <p className="mt-2 text-sm font-semibold text-[#536352]">Profile ID: {staff.id}</p>
            <p className="text-sm font-semibold text-[#536352]">Created: {formatDate(staff.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="rounded-full border border-[#d8e0d4] bg-[#f2f6ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#60705f]">
              {staff.role.replaceAll("_", " ")}
            </p>
            <Link
              href="/super-admin/staff"
              className="mt-3 inline-block rounded-xl border border-[#d8e0d4] px-3 py-2 text-xs font-black text-[#1b3022]"
            >
              Back to Staff
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Open Enquiries", value: totalAssigned },
            { label: "Blocked Seats", value: totalBlockedSeats },
            { label: "Payment Verifications", value: totalVerified },
            { label: "Posts Published", value: totalPosts },
            { label: "Unread Notifications", value: unreadNotifications },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-[#d8e0d4] bg-[#f7faf5] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6d7c6c]">{metric.label}</p>
              <p className="mt-1 text-2xl font-black text-[#1b3022]">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={updateStaffProfileAction} className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Account Controls</p>
          <input type="hidden" name="staff_id" value={staff.id} />
          <div className="mt-3 grid gap-2">
            <input
              name="full_name"
              defaultValue={staff.full_name ?? ""}
              placeholder="Full name"
              className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
            />
            <select
              name="role"
              defaultValue={staff.role}
              className="rounded-xl border border-[#d7ddd3] bg-white px-3 py-2 text-sm font-semibold text-[#1b3022]"
            >
              <option value="staff">Staff</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <PendingSubmitButton
            idleLabel="Save Profile"
            pendingLabel="Saving..."
            className="mt-3 rounded-xl bg-[#1b3022] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white"
          />
        </form>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Danger Zone</p>
          <p className="mt-2 text-sm font-semibold text-[#536352]">
            Remove a staff account only when they have left. Assigned enquiries and blocked seats are auto-unlinked.
          </p>
          <form action={removeStaffAccountAction} className="mt-4">
            <input type="hidden" name="staff_id" value={staff.id} />
            <PendingSubmitButton
              idleLabel={canDelete ? "Delete Staff Account" : "Delete Disabled For Current User"}
              pendingLabel="Deleting..."
              disabled={!canDelete}
              className="rounded-xl border border-[#d7ddd3] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1b3022] disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Assigned Enquiries</p>
          <div className="mt-3 space-y-2">
            {(enquiriesRes.data ?? []).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">{item.name}</p>
                <p className="text-xs font-semibold text-[#556455]">{item.phone} · {item.status.replaceAll("_", " ")}</p>
              </div>
            ))}
            {(enquiriesRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No assigned enquiries.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Blocked Seats</p>
          <div className="mt-3 space-y-2">
            {(seatsRes.data ?? []).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">Seat {item.seat_number}</p>
                <p className="text-xs font-semibold text-[#556455]">{item.block_reason || "No reason"}</p>
              </div>
            ))}
            {(seatsRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No blocked seats.</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Recent Verification Actions</p>
          <div className="mt-3 space-y-2">
            {(txRes.data ?? []).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">₹{Number(item.amount || 0).toFixed(0)} · {item.verification_status}</p>
                <p className="text-xs font-semibold text-[#556455]">{(item.readers as { name?: string } | null)?.name || "Student"} · {(item.bills as { title?: string } | null)?.title || "Bill"}</p>
                <p className="text-[11px] font-semibold text-[#6d7c6c]">{formatDate(item.submitted_at)}</p>
              </div>
            ))}
            {(txRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No verification actions.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#d8e0d4] bg-white p-5 shadow-lg shadow-[#27452e]/6">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6d7c6c]">Posts Authored</p>
          <div className="mt-3 space-y-2">
            {(postsRes.data ?? []).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f5f8f3] px-3 py-2">
                <p className="text-sm font-black text-[#1b3022]">{item.title}</p>
                <p className="text-xs font-semibold text-[#556455]">{item.type} · {item.status}</p>
                <p className="text-[11px] font-semibold text-[#6d7c6c]">{formatDate(item.created_at)}</p>
              </div>
            ))}
            {(postsRes.data ?? []).length === 0 ? <p className="text-sm font-semibold text-[#6d7c6c]">No authored posts.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
