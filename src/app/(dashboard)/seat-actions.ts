"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { createNotification, notifyReader } from "@/lib/notifications";
import { getISTTimestamp } from "@/lib/date-utils";
import { type AppRole } from "@/lib/billing-utils";

import {
  getString,
  getOptionalString,
  successState,
  errorState,
  type SimpleActionState,
} from "./actions-utils";

async function requireRole(allowedRoles: AppRole[]) {
  return requireDashboardContext(allowedRoles);
}

async function notifyActor(profileId: string, title: string, body: string, link?: string) {
  await createNotification({
    audienceType: "profile",
    audienceId: profileId,
    category: "account",
    title,
    body,
    link,
  });
}

export async function blockSeatForEnquiry(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const seatId = getString(formData, "seat_id");
  const enquiryId = getOptionalString(formData, "enquiry_id");
  const reason = getString(formData, "reason") || "Seat blocked for follow-up";

  if (!seatId) {
    await notifyActor(profile.id, "Seat block failed", "Seat is required.");
    return;
  }

  const { data: seat } = await supabase.from("seats").select("id, status, seat_number").eq("id", seatId).maybeSingle();

  if (!seat) {
    await notifyActor(profile.id, "Seat block failed", "Seat record not found.");
    return;
  }

  if (seat.status !== "available") {
    await notifyActor(profile.id, "Seat block failed", `Seat ${seat.seat_number ?? ""} is currently '${seat.status}', not available.`);
    return;
  }

  if (enquiryId) {
    const { data: enquiryState } = await supabase.from("enquiries").select("status").eq("id", enquiryId).maybeSingle();
    if (enquiryState?.status === "converted") {
      await notifyActor(profile.id, "Seat block skipped", "This enquiry is already converted.");
      return;
    }
  }

  await supabase.from("seats").update({
    status: "blocked",
    blocked_by_profile_id: profile.id,
    block_reason: reason,
    linked_enquiry_id: enquiryId,
  }).eq("id", seatId);

  const sideEffects = [];

  if (enquiryId) {
    sideEffects.push(supabase.from("enquiries").update({ status: "seat_blocked" }).eq("id", enquiryId));

    const { data: enquiry } = await supabase.from("enquiries").select("name, email").eq("id", enquiryId).maybeSingle();
    
    if (enquiry?.email) {
      const emailTemplate = emailTemplates.seatAvailable({
        name: enquiry.name,
        seatLabel: seat.seat_number || seatId,
      });
      sideEffects.push(sendEmail({
        to: [enquiry.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }));
    }
  }

  await Promise.allSettled(sideEffects);

  revalidatePath("/super-admin/seats");
  revalidatePath("/super-admin/enquiries");
  if (enquiryId) revalidatePath(`/super-admin/enquiries/${enquiryId}`);
  revalidatePath("/staff/seats");
  revalidatePath("/staff/enquiries");
}

export async function releaseSeat(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const seatId = getString(formData, "seat_id");

  if (!seatId) return;

  await Promise.all([
    supabase.from("seats").update({
      status: "available",
      assigned_reader_id: null,
      blocked_by_profile_id: null,
      block_reason: null,
      linked_enquiry_id: null,
    }).eq("id", seatId),
    supabase.from("readers").update({ fixed_seat_id: null }).eq("fixed_seat_id", seatId)
  ]);

  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
}

export async function requestSeatChangeAction(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const { student } = await requireRole(["student"]);
  if (!student) return errorState("Your session expired. Please sign in again.");

  const supabase = createAdminClient();
  const newSeatId = getString(formData, "new_seat_id");
  if (!newSeatId) return errorState("Select a preferred seat before submitting.");
  if (student.fixed_seat_id === newSeatId) return errorState("You are already assigned to that seat.");

  const { data: existingPending } = await supabase.from("seat_change_requests").select("id").eq("reader_id", student.id).eq("status", "pending").limit(1).maybeSingle();
  if (existingPending) return errorState("You already have a pending seat-change request.");

  const { data: newSeat } = await supabase.from("seats").select("id, seat_number, status").eq("id", newSeatId).eq("status", "available").maybeSingle();
  if (!newSeat) return errorState("That seat is no longer available. Pick another seat and try again.");

  const { data: oldSeat } = student.fixed_seat_id
    ? await supabase.from("seats").select("seat_number").eq("id", student.fixed_seat_id).maybeSingle()
    : { data: null };

  const { data: request, error: requestError } = await supabase.from("seat_change_requests").insert({
    reader_id: student.id,
    current_seat_id: student.fixed_seat_id ?? null,
    requested_seat_id: newSeat.id,
    status: "pending",
  }).select("id").single();

  if (requestError || !request) return errorState(requestError?.message || "Could not submit your seat-change request.");

  await createNotification({
    audienceType: "broadcast_role",
    category: "seat_change_request",
    title: "Seat Change Request",
    body: `${student.name} wants to move from Seat #${oldSeat?.seat_number ?? "?"} → Seat #${newSeat.seat_number}.`,
    link: "/staff/seats",
    metadata: {
      request_id: request.id,
      reader_id: student.id,
      reader_name: student.name,
      old_seat_id: student.fixed_seat_id ?? null,
      old_seat_number: oldSeat?.seat_number ?? null,
      new_seat_id: newSeat.id,
      new_seat_number: newSeat.seat_number,
    },
  });

  revalidatePath("/student");
  revalidatePath("/student/profile");
  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");

  return successState(`Seat #${newSeat.seat_number} has been requested. Staff approval is still pending.`);
}

export async function approveSeatChangeAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const requestId = getString(formData, "request_id");
  if (!requestId) return;

  const { data: request } = await supabase.from("seat_change_requests").select("id, reader_id, current_seat_id, requested_seat_id, status").eq("id", requestId).maybeSingle();
  if (!request || request.status !== "pending") return;

  const { data: requestedSeat } = await supabase.from("seats").select("seat_number, status").eq("id", request.requested_seat_id).maybeSingle();
  if (!requestedSeat || requestedSeat.status !== "available") return;

  const sideEffects = [];

  if (request.current_seat_id) {
    sideEffects.push(supabase.from("seats").update({ status: "available", assigned_reader_id: null }).eq("id", request.current_seat_id));
  }

  sideEffects.push(supabase.from("seats").update({ status: "occupied", assigned_reader_id: request.reader_id }).eq("id", request.requested_seat_id));
  sideEffects.push(supabase.from("readers").update({ fixed_seat_id: request.requested_seat_id }).eq("id", request.reader_id));
  sideEffects.push(supabase.from("seat_change_requests").update({
    status: "approved",
    resolved_at: getISTTimestamp(),
    resolved_by_profile_id: profile.id,
  }).eq("id", requestId));
  
  sideEffects.push(supabase.from("notifications").update({ read_at: getISTTimestamp() }).eq("category", "seat_change_request").contains("metadata", { request_id: requestId }));

  sideEffects.push(notifyReader(request.reader_id, {
    category: "account",
    title: "Seat Change Approved",
    body: `Your request to move to Seat #${requestedSeat.seat_number} has been approved.`,
    link: "/student/profile",
  }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");
  revalidatePath("/student");
  revalidatePath("/student/profile");
}

export async function denySeatChangeAction(formData: FormData) {
  const { profile } = await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const requestId = getString(formData, "request_id");
  if (!requestId) return;

  const { data: request } = await supabase.from("seat_change_requests").select("id, reader_id, requested_seat_id, status").eq("id", requestId).maybeSingle();
  if (!request || request.status !== "pending") return;

  const { data: requestedSeat } = await supabase.from("seats").select("seat_number").eq("id", request.requested_seat_id).maybeSingle();

  const sideEffects = [];

  sideEffects.push(supabase.from("seat_change_requests").update({
    status: "declined",
    resolved_at: getISTTimestamp(),
    resolved_by_profile_id: profile.id,
  }).eq("id", requestId));

  sideEffects.push(supabase.from("notifications").update({ read_at: getISTTimestamp() }).eq("category", "seat_change_request").contains("metadata", { request_id: requestId }));

  sideEffects.push(notifyReader(request.reader_id, {
    category: "account",
    title: "Seat Change Declined",
    body: `Your request for Seat #${requestedSeat?.seat_number ?? "?"} was declined by staff. Please contact the hub for more info.`,
    link: "/student/profile",
  }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/staff/seats");
  revalidatePath("/super-admin/seats");
  revalidatePath("/student/profile");
}

export async function assignSeatFromMapAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const readerId = getString(formData, "reader_id");
  const seatId = getString(formData, "seat_id");
  if (!readerId || !seatId) return;

  const next = new FormData();
  next.set("reader_id", readerId);
  next.set("seat_id", seatId);
  await updateStudentSeatAction(next);

  revalidatePath("/super-admin/seats");
  revalidatePath("/staff/seats");
}

export async function updateStudentSeatAction(formData: FormData) {
  await requireRole(["super_admin", "staff"]);
  const supabase = createAdminClient();
  const readerId = getString(formData, "reader_id");
  const requestedSeatId = getOptionalString(formData, "seat_id");
  if (!readerId) return;

  const { data: reader } = await supabase.from("readers").select("id, fixed_seat_id").eq("id", readerId).maybeSingle();
  if (!reader) return;

  const currentSeatId = reader.fixed_seat_id;

  if (!requestedSeatId) {
    if (currentSeatId) {
      await supabase.from("seats").update({ status: "available", assigned_reader_id: null }).eq("id", currentSeatId);
      await supabase.from("seat_shift_logs").insert({
        reader_id: readerId,
        old_seat_id: currentSeatId,
        new_seat_id: null,
        reason: "Seat released by admin",
      });
    }
    await supabase.from("readers").update({ fixed_seat_id: null }).eq("id", readerId);
    revalidatePath("/super-admin/students");
    revalidatePath("/staff/students");
    return;
  }

  if (currentSeatId === requestedSeatId) return;

  const { data: targetSeat } = await supabase.from("seats").select("id, status, assigned_reader_id").eq("id", requestedSeatId).maybeSingle();
  if (!targetSeat) return;
  const isSeatFree = targetSeat.status === "available" || targetSeat.assigned_reader_id === readerId;
  if (!isSeatFree) return;

  const sideEffects = [];

  if (currentSeatId) {
    sideEffects.push(supabase.from("seats").update({ status: "available", assigned_reader_id: null }).eq("id", currentSeatId));
  }

  sideEffects.push(supabase.from("seats").update({ status: "occupied", assigned_reader_id: readerId }).eq("id", requestedSeatId));
  sideEffects.push(supabase.from("readers").update({ fixed_seat_id: requestedSeatId }).eq("id", readerId));
  sideEffects.push(supabase.from("seat_shift_logs").insert({
    reader_id: readerId,
    old_seat_id: currentSeatId,
    new_seat_id: requestedSeatId,
    reason: "Seat reassigned by admin",
  }));

  await Promise.allSettled(sideEffects);

  revalidatePath("/super-admin/students");
  revalidatePath("/staff/students");
}
