"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function getIndiaTime() {
  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return {
    time: timeFormatter.format(new Date()),
    date: dateFormatter.format(new Date()),
  };
}

export function IndiaTime({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [indiaTime, setIndiaTime] = useState(() => getIndiaTime());

  const classes = useMemo(
    () =>
      compact
        ? {
            wrapper: "mt-1 flex items-center gap-1.5 text-[#536352]",
            icon: "h-3.5 w-3.5",
            time: "text-sm font-semibold text-[#536352]",
          }
        : {
            wrapper: "mt-3 flex items-center gap-2 rounded-xl bg-[#f3f7f0] px-3 py-2 text-[#536352]",
            icon: "h-4 w-4",
            time: "text-sm font-semibold text-[#1b3022]",
          },
    [compact],
  );

  useEffect(() => {
    setMounted(true);
    const updateTime = () => setIndiaTime(getIndiaTime());
    const interval = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!mounted) return <div className={cn(classes.wrapper, className)}><Clock3 className={classes.icon} /></div>;

  return (
    <div className={cn(classes.wrapper, className)}>
      <Clock3 className={classes.icon} />
      <div>
        <p className={classes.time}>{indiaTime.time}</p>
        <p className="text-sm text-[#6b7b69]">{indiaTime.date}</p>
      </div>
    </div>
  );
}
