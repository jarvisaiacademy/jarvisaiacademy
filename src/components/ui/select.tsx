"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps {
  options: SelectOption[];
  /** Accessible name — the trigger renders as a button, so it needs one. */
  label: string;
  /** Surface-specific chrome (colour, size, radius); layout and states live here. */
  className?: string;
  /** Controlled popup state — omit to let Base UI manage it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SingleSelectProps extends BaseSelectProps {
  multiple?: false;
  value: string;
  onValueChange: (value: string) => void;
}

interface MultipleSelectProps extends BaseSelectProps {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
}

export type SelectProps = SingleSelectProps | MultipleSelectProps;

/**
 * The app's dropdown. Wraps Base UI's Select so every surface gets the same
 * keyboard behaviour and popup styling rather than the browser's native menu.
 *
 * `multiple` is Base UI's own (1.8.0), not a local reimplementation, so the popup already
 * stays open between picks and each item carries its own indicator. The two branches below
 * exist only because Base UI spells the value type differently per mode — `T` versus `T[]` —
 * and passing `multiple` as a runtime boolean would collapse that distinction.
 */
export function Select(props: SelectProps) {
  const { options, label, className, open, onOpenChange } = props;

  // Only pass these when the caller wants control, so the default stays
  // uncontrolled instead of pinning the popup to a stale value.
  const popup = open === undefined ? {} : { open, onOpenChange };

  const chrome = (
    <>
      <BaseSelect.Trigger
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-between gap-2 cursor-pointer select-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className
        )}
      >
        <BaseSelect.Value />
        <BaseSelect.Icon className="shrink-0 opacity-60">
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          className="z-50 outline-hidden select-none"
        >
          <BaseSelect.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] p-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg transition-[scale,opacity] duration-100 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
            <BaseSelect.List className="relative max-h-64 overflow-y-auto scroll-py-1">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 py-1.5 pr-3 pl-2 rounded-lg text-xs outline-hidden select-none data-highlighted:bg-muted data-highlighted:text-foreground"
                >
                  <BaseSelect.ItemIndicator className="col-start-1 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2 truncate">
                    {option.label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </>
  );

  if (props.multiple) {
    return (
      <BaseSelect.Root<string, true>
        items={options}
        multiple
        value={props.value}
        onValueChange={(next) => props.onValueChange(next)}
        {...popup}
      >
        {chrome}
      </BaseSelect.Root>
    );
  }

  return (
    <BaseSelect.Root<string, false>
      items={options}
      value={props.value}
      // Base UI reports a cleared selection as null; the single-select contract here is a
      // plain string, so a clear is not forwarded rather than invented as "".
      onValueChange={(next) => {
        if (typeof next === "string") props.onValueChange(next);
      }}
      {...popup}
    >
      {chrome}
    </BaseSelect.Root>
  );
}
