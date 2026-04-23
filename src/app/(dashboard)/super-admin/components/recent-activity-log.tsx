import { formatDateToIST } from "@/lib/utils";
import { UserPlus, FileText, CheckCircle, AlertCircle, Clock, Banknote } from "lucide-react";

export type ActivityLog = {
  id: string;
  title: string;
  description: string;
  type: "enquiry" | "student" | "payment" | "system" | "invoice";
  timestamp: string;
};

const iconMap = {
  enquiry: <AlertCircle className="h-4 w-4 text-amber-600" />,
  student: <UserPlus className="h-4 w-4 text-blue-600" />,
  payment: <Banknote className="h-4 w-4 text-emerald-600" />,
  invoice: <FileText className="h-4 w-4 text-purple-600" />,
  system: <CheckCircle className="h-4 w-4 text-gray-600" />,
};

const bgMap = {
  enquiry: "bg-amber-100 border-amber-200",
  student: "bg-blue-100 border-blue-200",
  payment: "bg-emerald-100 border-emerald-200",
  invoice: "bg-purple-100 border-purple-200",
  system: "bg-gray-100 border-gray-200",
};

export function RecentActivityLog({ activities }: { activities: ActivityLog[] }) {
  return (
    <div className="rounded-[2rem] border border-[#d8e0d4] bg-white p-6 shadow-lg shadow-[#27452e]/6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Audit Trail</p>
          <h2 className="mt-1 text-xl font-bold text-[#1b3022]">Recent Platform Activity</h2>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${bgMap[activity.type]}`}>
                  {iconMap[activity.type]}
                </div>
                <div className="w-px h-full bg-gray-200 my-1"></div>
              </div>
              <div className="pb-4 pt-1">
                <p className="text-sm font-bold text-[#1b3022]">{activity.title}</p>
                <p className="mt-0.5 text-xs text-[#536352]">{activity.description}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#889b87]">
                  <Clock className="h-3 w-3" />
                  {formatDateToIST(activity.timestamp, "datetime")}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm font-medium text-[#6d7c6c]">
            No recent activities found.
          </div>
        )}
      </div>
    </div>
  );
}
