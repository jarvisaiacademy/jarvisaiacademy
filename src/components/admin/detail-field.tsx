import React from "react";
import { cn } from "@/lib/utils";

/**
 * One label/value pair of a read-only detail view. `className` carries the entry's grid span,
 * which is how a long value gets the width it needs instead of wrapping inside a quarter column.
 *
 * Shared by the course view and the teacher view so the two pages cannot end up labelling and
 * spacing the same kind of entry differently.
 */
export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <div className="text-xs text-neutral-900 dark:text-neutral-100 break-words">{children}</div>
    </div>
  );
}

export default Field;
