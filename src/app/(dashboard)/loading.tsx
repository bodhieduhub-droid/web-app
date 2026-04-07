import { Spinner } from "@/components/ui/spinner";

export default function DashboardLoading() {
  return (
    <div className="min-h-[50vh] rounded-[2rem] border border-[#d8e0d4] bg-white p-8 shadow-lg shadow-[#27452e]/6">
      <div className="flex items-center gap-3 text-[#1b3022]">
        <Spinner className="h-5 w-5" />
        <p className="text-sm font-bold uppercase tracking-[0.24em]">Loading dashboard...</p>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded-full bg-[#e8efe4]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[#eef3ea]" />
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#eef3ea]" />
      </div>
    </div>
  );
}
