import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="h-32 w-full rounded-[2rem] bg-white border border-[#d8e0d4] shadow-lg shadow-[#27452e]/6 animate-pulse flex items-center px-6">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-[#f3f7f0] rounded-full" />
          <div className="h-8 w-64 bg-[#f3f7f0] rounded-lg" />
        </div>
      </div>
      
      <div className="grid gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-[1.6rem] bg-white border border-[#d8e0d4] shadow-sm animate-pulse p-4 space-y-3">
             <div className="h-2 w-16 bg-[#f3f7f0] rounded-full" />
             <div className="h-6 w-12 bg-[#f3f7f0] rounded-lg" />
          </div>
        ))}
      </div>

      <div className="h-96 w-full rounded-[2rem] bg-white border border-[#d8e0d4] shadow-lg shadow-[#27452e]/6 animate-pulse p-6">
        <div className="flex items-center justify-center h-full">
           <Loader2 className="h-8 w-8 animate-spin text-[#1b3022] opacity-20" />
        </div>
      </div>
    </div>
  );
}
