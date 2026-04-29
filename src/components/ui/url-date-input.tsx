"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface URLDateInputProps {
  name: string;
  defaultValue?: string;
  className?: string;
  paramName?: string;
}

export function URLDateInput({
  name,
  defaultValue,
  className = "",
  paramName,
}: URLDateInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const targetParam = paramName || name;

  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set(targetParam, e.target.value);
        } else {
          params.delete(targetParam);
        }
        router.replace(`${pathname}?${params.toString()}`);
      }}
      className={`bg-transparent text-sm font-bold text-[#1b3022] outline-none ${className}`}
    />
  );
}
