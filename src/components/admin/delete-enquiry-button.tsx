"use client";

import { Trash2, Loader2 } from "lucide-react";
import { deleteEnquiryAction } from "@/app/(dashboard)/actions";
import { useTransition } from "react";

export function DeleteEnquiryButton({ 
  enquiryId, 
  redirect = false,
  className = "" 
}: { 
  enquiryId: string; 
  redirect?: boolean;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this enquiry?")) return;

    const formData = new FormData();
    formData.append("enquiry_id", enquiryId);
    if (redirect) {
      formData.append("redirect", "yes");
    }

    startTransition(async () => {
      try {
        await deleteEnquiryAction(formData);
      } catch (error) {
        alert("Failed to delete enquiry.");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`group flex items-center justify-center rounded-xl border border-[#d8e0d4] bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50 ${className}`}
      title="Delete Enquiry"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 transition group-hover:scale-110" />
      )}
    </button>
  );
}
