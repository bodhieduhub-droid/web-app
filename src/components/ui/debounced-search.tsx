"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface DebouncedSearchProps {
  placeholder?: string;
  paramName?: string;
  defaultValue?: string;
  className?: string;
  delay?: number;
}

export function DebouncedSearch({
  placeholder = "Search...",
  paramName = "q",
  defaultValue = "",
  className = "",
  delay = 500,
}: DebouncedSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (value === defaultValue && !searchParams.get(paramName)) return;
    
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      
      // Reset to page 1 if searching
      if (params.has("page")) {
        params.set("page", "1");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [value, paramName, router, pathname, searchParams, delay, defaultValue]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6d7c6c]" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] pl-11 pr-11 py-3 text-sm font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)] focus:outline-none"
      />
      {isPending && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-[#1b3022]" />
        </div>
      )}
    </div>
  );
}
