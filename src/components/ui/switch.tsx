"use client";

import React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * What the control does, for screen readers. The state is already announced through
   * `role="switch"`, so this names the thing being switched, not the state it is in.
   */
  label: string;
  className?: string;
}

/**
 * A themed on/off control.
 *
 * A `<button role="switch">` rather than `<input type="checkbox">`: the platform draws a
 * checkbox's chrome in the OS's own colours and no amount of CSS reaches it, which is why this
 * project renders no control it cannot theme. Same reason `select.tsx` exists.
 */
export function Switch({ checked, onCheckedChange, disabled, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : "bg-neutral-300 dark:bg-white/15"
      } ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
