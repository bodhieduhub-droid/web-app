"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface URLSelectProps {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  className?: string;
  paramName?: string;
}

export function URLSelect({
  name,
  defaultValue = "all",
  options,
  className = "",
  paramName,
}: URLSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetParam = paramName || name;

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(targetParam, e.target.value);
        params.set("page", "1"); // Reset to page 1 on filter change
        router.replace(`${pathname}?${params.toString()}`);
      }}
      className={`rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-3 text-sm font-semibold text-[#1b3022] transition-all focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,48,34,0.1)] focus:outline-none relative z-10 ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
