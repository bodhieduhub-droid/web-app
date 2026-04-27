import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BodhiLogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  title?: string;
  subtitle?: string;
  showText?: boolean;
};

export function BodhiLogo({
  href = "/",
  className,
  markClassName,
  titleClassName,
  subtitleClassName,
  title = "Bodhi Edu Hub",
  subtitle = "Reading Hub",
  showText = true,
  miniVariant = false,
}: BodhiLogoProps & { miniVariant?: boolean }) {
  if (miniVariant) {
    return (
      <Link href={href} className={cn("hidden tablet-mini-show", className)}>
        <div className="h-10 w-10 rounded-xl bg-[#1b3022] flex items-center justify-center text-white font-black text-xl">
          B
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex h-16 w-16 items-center justify-center",
          markClassName,
        )}
      >
        <Image
          src="/logo.svg"
          alt="Bodhi Edu Hub logo"
          fill
          className="object-contain"
          sizes="64px"
          priority
        />
      </div>
      {showText ? (
        <div>
          <p className={cn("text-2xl font-black uppercase tracking-tight text-[#1b3022]", titleClassName)}>
            {title}
          </p>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.3em] text-[#6a7b69]",
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        </div>
      ) : null}
    </Link>
  );
}
