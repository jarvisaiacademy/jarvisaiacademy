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
 *
 * Green when on and red when off everywhere, deliberately: this switch only ever means
 * "is this thing active", and a colour that has to be read the same way in every table is the
 * point of it. A neutral off state left an admin checking each row's word instead of its colour.
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
        checked ? "bg-emerald-500" : "bg-red-500"
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

interface StatusSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Names the thing being switched, for screen readers. Not the state. */
  label: string;
  /** The state, in words, beside the colour. Defaults to the app's status vocabulary. */
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

/**
 * A switch with its state written next to it.
 *
 * The colour says it at a glance and the word says it exactly — which matters in a table where
 * red also has to mean "banned" and "inactive", and colour alone would not tell them apart.
 */
export function StatusSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
  onLabel = "Active",
  offLabel = "Inactive",
  className,
}: StatusSwitchProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        label={label}
      />
      <span
        className={`text-[11px] font-semibold ${
          checked ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}
