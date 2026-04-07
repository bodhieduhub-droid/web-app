import { Spinner } from "@/components/ui/spinner";

export default function AppLoading() {
  return (
    <main className="min-h-screen bg-[#f3f0e7] text-[#1b3022]">
      <div className="border-b border-[#d8e0d4] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-[#d9e3d2]" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-full bg-[#dfe8d7]" />
              <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#edf2e8]" />
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-3 w-16 animate-pulse rounded-full bg-[#e7eee0]" />
            ))}
            <div className="ml-4 h-11 w-32 animate-pulse rounded-xl bg-[#1b3022]/14" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5" />
          <p className="text-sm font-bold uppercase tracking-[0.24em]">Loading page...</p>
        </div>

        <section className="mt-8 grid gap-10 rounded-[2.8rem] border border-[#d8ddcf] bg-[linear-gradient(135deg,#f5f1e8_0%,#ece6d8_50%,#e7efe0_100%)] px-8 py-10 shadow-[0_18px_45px_rgba(39,69,46,0.06)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="h-9 w-64 animate-pulse rounded-full bg-white/80" />
            <div className="mt-8 h-20 w-full max-w-3xl animate-pulse rounded-[2rem] bg-white/70" />
            <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/70" />
            <div className="mt-3 h-5 w-4/5 max-w-xl animate-pulse rounded-full bg-white/60" />
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="h-12 w-48 animate-pulse rounded-full bg-[#d7e3d0]" />
              <div className="h-12 w-40 animate-pulse rounded-full bg-white/75" />
            </div>
          </div>

          <div className="rounded-[2.4rem] border border-[#cad4c1] bg-[#1f3828] p-6 shadow-[0_20px_50px_rgba(24,40,29,0.18)]">
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/15" />
            <div className="mt-5 h-14 w-full animate-pulse rounded-[1.4rem] bg-white/10" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/10" />
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-[#f0e6d2]" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-white/10" />
              <div className="h-14 animate-pulse rounded-[1.2rem] bg-white/10" />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-[#d8ddcf] bg-[#fffdf7] p-8 shadow-[0_18px_45px_rgba(39,69,46,0.06)]">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#dfe8d7]" />
              <div className="mt-5 h-10 w-4/5 animate-pulse rounded-[1rem] bg-[#edf2e8]" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-[#edf2e8]" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-[#edf2e8]" />
              <div className="mt-8 h-10 w-32 animate-pulse rounded-full bg-[#d7e3d0]" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
