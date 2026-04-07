"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Shows a slim animated bar at the top of the page.
 * - Starts (fake-progresses) immediately when any <a href> inside the app is clicked
 * - Completes and hides as soon as the new pathname lands
 */
export function TopLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const prevRef = useRef(pathname);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect link clicks → start the bar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      // Only trigger for internal, non-hash links
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto")) return;
      if (href === pathname) return; // same page

      setActive(true);
      setWidth(15); // jump to 15% immediately

      // Fake-progress up to 85% over ~1.5 s
      let current = 15;
      const grow = () => {
        current = Math.min(current + Math.random() * 12, 85);
        setWidth(current);
        if (current < 85) rafRef.current = setTimeout(grow, 180);
      };
      rafRef.current = setTimeout(grow, 180);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  // Pathname changed → complete the bar
  useEffect(() => {
    if (prevRef.current === pathname) return;
    prevRef.current = pathname;

    if (rafRef.current) clearTimeout(rafRef.current);
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 350);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!active && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] rounded-r-full bg-[#1b3022] shadow-sm"
      style={{
        width: `${width}%`,
        transition: width === 100 ? "width 250ms ease-out" : "width 200ms ease-in-out",
        opacity: active ? 1 : 0,
      }}
    />
  );
}
