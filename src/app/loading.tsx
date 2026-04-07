import { Spinner } from "@/components/ui/spinner";

export default function AppLoading() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] px-6 py-10 text-[#1b3022]">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" />
          <p className="text-sm font-bold uppercase tracking-[0.24em]">Loading page...</p>
        </div>

        <div className="rounded-[2.4rem] border border-[#d8ddcf] bg-white/70 p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
          <div className="h-4 w-32 animate-pulse rounded-full bg-[#dfe8d7]" />
          <div className="mt-6 h-16 w-full max-w-3xl animate-pulse rounded-[1.6rem] bg-[#e7eee0]" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-[#e7eee0]" />
          <div className="mt-8 flex gap-4">
            <div className="h-12 w-48 animate-pulse rounded-full bg-[#d7e3d0]" />
            <div className="h-12 w-40 animate-pulse rounded-full bg-[#edf2e8]" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-[#d8ddcf] bg-white p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#dfe8d7]" />
              <div className="mt-5 h-10 w-full animate-pulse rounded-[1rem] bg-[#edf2e8]" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-[#edf2e8]" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[#edf2e8]" />
              <div className="mt-8 h-10 w-32 animate-pulse rounded-full bg-[#d7e3d0]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
