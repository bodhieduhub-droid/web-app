import { ChevronDown, RefreshCw } from "lucide-react";

type TimerQuoteProps = {
  quote: string;
  onNext: () => void;
  examCategory: string;
  onExamChange: (category: string) => void;
};

const CATEGORIES = ["DEFAULT", "UPSC", "SSC", "PSC", "BANKING", "RAILWAY"];

export function TimerQuote({ quote, onNext, examCategory, onExamChange }: TimerQuoteProps) {
  return (
    <div className="rounded-3xl border border-[#dde8d8] bg-[#fafcf8] p-3.5 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-[0.38em] text-[#9aad98]">Daily Thought</p>

        <div className="group relative">
          <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[#9aad98] transition hover:bg-[#edf2ea] hover:text-[#1b3022]">
            {examCategory === "DEFAULT" ? "General" : examCategory}
            <ChevronDown className="h-3 w-3" />
          </button>
          <div className="absolute right-0 top-full z-20 mt-1 hidden w-28 flex-col overflow-hidden rounded-xl border border-[#dde8d8] bg-white shadow-lg group-hover:flex">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onExamChange(cat)}
                className={`px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest transition hover:bg-[#f5f9f3] ${
                  examCategory === cat ? "bg-[#f5f9f3] text-[#1b3022]" : "text-[#6d7c6c]"
                }`}
              >
                {cat === "DEFAULT" ? "General" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium italic leading-relaxed text-[#1b3022]/65 sm:text-sm">
        &ldquo;{quote}&rdquo;
      </p>

      <button
        onClick={onNext}
        className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#9aad98] transition hover:text-[#1b3022] active:scale-95"
      >
        <RefreshCw className="h-3 w-3" />
        Next quote
      </button>
    </div>
  );
}
