"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  idleLabel: string;
  pendingLabel?: string;
};

export function PendingSubmitButton({
  idleLabel,
  pendingLabel = "Processing...",
  className,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      className={className}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : null}
        <span>{pending ? pendingLabel : idleLabel}</span>
      </span>
    </button>
  );
}
