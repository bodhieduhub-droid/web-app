"use client";

import { useState } from "react";

export function ExpandableText({
  text,
  lines = 3,
  className = "",
}: {
  text: string;
  lines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = text.trim().length > 180;

  return (
    <div>
      <p
        className={className}
        style={
          !expanded && showToggle
            ? {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
            : undefined
        }
      >
        {text}
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 text-sm font-semibold text-[#1b3022] underline underline-offset-2"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
