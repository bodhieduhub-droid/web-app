"use client";

import { useState } from "react";
import { updateEnquiryStatus } from "@/app/(dashboard)/super-admin/enquiries/kanban-actions";
import { Mail, Phone, Calendar, Clock, Loader2 } from "lucide-react";

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  visit_date: string | null;
  visit_time: string | null;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
};

const COLUMNS = [
  { id: "new", title: "New Lead", color: "bg-blue-50 border-blue-200 text-blue-900" },
  { id: "contacted", title: "Contacted", color: "bg-purple-50 border-purple-200 text-purple-900" },
  { id: "seat_blocked", title: "Seat Blocked", color: "bg-amber-50 border-amber-200 text-amber-900" },
  { id: "converted", title: "Converted", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  { id: "closed", title: "Closed / Lost", color: "bg-slate-50 border-slate-200 text-slate-700" }
];

export function KanbanBoard({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");

    if (!id) return;
    
    const enquiry = enquiries.find((eq) => eq.id === id);
    if (!enquiry || enquiry.status === newStatus) return;

    // Optimistic UI update
    setEnquiries((prev) => prev.map((eq) => (eq.id === id ? { ...eq, status: newStatus } : eq)));
    setLoadingId(id);

    // Backend sync
    const res = await updateEnquiryStatus(id, newStatus);
    setLoadingId(null);
    if (res.error) {
      // Revert if error
      setEnquiries((prev) => prev.map((eq) => (eq.id === id ? { ...eq, status: enquiry.status } : eq)));
      alert("Failed to update status: " + res.error);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[600px]">
      {COLUMNS.map((col) => (
        <div 
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          className={`flex-shrink-0 w-80 rounded-[1.4rem] border border-[#d8e0d4] bg-[#f9fbf8] flex flex-col`}
        >
          <div className={`px-4 py-3 border-b border-[#d8e0d4] rounded-t-[1.4rem] ${col.color} border-l-0 border-r-0 border-t-0 font-bold uppercase tracking-widest text-[11px]`}>
            {col.title} <span className="ml-2 bg-white/50 px-2 py-0.5 rounded-full text-[10px]">{enquiries.filter(e => e.status === col.id).length}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {enquiries
              .filter((e) => e.status === col.id)
              .map((enquiry) => (
                <div
                  key={enquiry.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, enquiry.id)}
                  className="bg-white border text-left cursor-grab active:cursor-grabbing border-[#d8e0d4] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#1b3022] transition-all relative"
                >
                  {loadingId === enquiry.id && (
                    <div className="absolute top-2 right-2 p-1 bg-white rounded-full shadow">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    </div>
                  )}
                  <h4 className="font-bold text-[#1b3022] text-sm mb-1">{enquiry.name}</h4>
                  <div className="space-y-1.5 mt-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#536352]">
                      <Phone className="w-3 h-3 text-[#7a8775]" /> {enquiry.phone}
                    </p>
                    {enquiry.email && (
                      <p className="flex items-center gap-2 text-xs text-[#536352] truncate">
                        <Mail className="w-3 h-3 text-[#7a8775]" /> {enquiry.email}
                      </p>
                    )}
                    {(enquiry.visit_date || enquiry.visit_time) && (
                      <div className="mt-3 bg-[#eef3ea] rounded-xl p-2 px-3 flex flex-col gap-1 border border-[#dde3d5]">
                        <p className="text-[10px] font-bold text-[#284632] uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Visit Log</p>
                        <p className="text-xs text-[#1b3022] font-semibold">{enquiry.visit_date || "Any day"} @ {enquiry.visit_time || "Any time"}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#f2f6ec] text-[10px] uppercase font-bold tracking-wider text-[#9aa79a]">
                    Owner: {enquiry.profiles?.full_name || "Unassigned"}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
