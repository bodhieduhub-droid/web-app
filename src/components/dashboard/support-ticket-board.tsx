import { updateSupportTicketStatusAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { StudentSupportTicketRecord } from "@/lib/app-types";

type TicketWithReader = StudentSupportTicketRecord & {
  readers?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

const statusOptions = [
  ["open", "Open"],
  ["in_review", "In Review"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
] as const;

export function SupportTicketBoard({
  heading,
  tickets,
}: {
  heading: string;
  tickets: TicketWithReader[];
}) {
  const openCount = tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_review").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Support Queue</p>
        <h1 className="mt-3 text-4xl font-black text-[#1b3022]">{heading}</h1>
        <p className="mt-2 text-sm font-semibold text-[#536352]">
          {openCount} open ticket{openCount !== 1 ? "s" : ""} need follow-up.
        </p>
      </section>

      <div className="space-y-4">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-black text-[#1b3022]">{ticket.subject}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-[#6d7c6c]">
                    {ticket.category} · {ticket.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="text-right text-xs font-semibold text-[#536352]">
                  <p>{new Date(ticket.created_at).toLocaleString("en-IN")}</p>
                  <p className="mt-1">{ticket.readers?.name || "Unknown student"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.4rem] bg-[#f5f8f3] p-4">
                <p className="text-sm font-semibold text-[#536352]">
                  {ticket.readers?.email || "No email"} · {ticket.readers?.phone || "No phone"}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#1b3022]">{ticket.message}</p>
              </div>

              <form action={updateSupportTicketStatusAction} className="mt-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <select
                  name="status"
                  defaultValue={ticket.status}
                  className="rounded-2xl border border-[#d7ddd3] bg-white px-4 py-3 text-sm font-semibold text-[#1b3022]"
                >
                  {statusOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <PendingSubmitButton
                  idleLabel="Update Status"
                  pendingLabel="Saving..."
                  className="rounded-2xl bg-[#1b3022] px-5 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-white"
                />
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-[2rem] border border-[#d8e0d4] bg-white px-6 py-10 text-sm font-semibold text-[#536352] shadow-lg shadow-[#27452e]/6">
            No support tickets yet.
          </div>
        )}
      </div>
    </div>
  );
}
