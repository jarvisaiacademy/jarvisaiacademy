"use client";

import * as React from "react";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxProps {
  /** The suggestions. Not a fence — see the docblock. */
  options: readonly string[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name. The visible label is the form's own, so the input needs its own. */
  label: string;
  placeholder?: string;
  /** Surface-specific chrome (colour, size, radius); layout and states live here. */
  className?: string;
}

/**
 * A text field that suggests, for the fields whose answers are drawn from a known handful of
 * phrases — a duration, a level, a badge — where typing them freehand is how spellings drift.
 *
 * Wraps Base UI's **Autocomplete**, not its Combobox, and that is the whole point: Base UI's
 * Combobox documents that it "does not allow free-form text input", which would make this a
 * closed list and cost an admin the ability to add a duration the vocabulary has not seen.
 * Autocomplete's input holds whatever is typed, and its list only optionally completes it.
 *
 * The list never narrows. `mode="none"` replaces the internal filter with one that always
 * passes, so every option stays on screen while the input holds a value — this is a menu to
 * pick from, not a search result, and hiding nine of them over one stray character reads as a
 * bug. What does follow the input is the *order*: the closer the match, the nearer the top, so
 * the obvious answer is still one glance and one Enter away.
 *
 * `open` is controlled, and the field opens the popup itself. Base UI's input-group press
 * handler stands down when the press lands on the input inside it — a typeable element — so
 * leaving the open to the group alone is a bet on a second hook firing. Base UI's own closes
 * still arrive through `onOpenChange`: a picked item, Escape, a press outside, or the chevron,
 * which toggles.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const ordered = React.useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query === "") return options;
    // Exact match, then the options that start with what was typed, then the ones that merely
    // contain it, then the rest. `sort` is stable, so each band keeps the list's own order and
    // the options do not reshuffle under the pointer as more is typed.
    const rank = (option: string) => {
      const candidate = option.toLowerCase();
      if (candidate === query) return 0;
      if (candidate.startsWith(query)) return 1;
      if (candidate.includes(query)) return 2;
      return 3;
    };
    return [...options].sort((a, b) => rank(a) - rank(b));
  }, [options, value]);

  return (
    <Autocomplete.Root
      items={ordered}
      mode="none"
      value={value}
      onValueChange={(next) => onValueChange(next ?? "")}
      open={open}
      onOpenChange={(next) => setOpen(next)}
    >
      <Autocomplete.InputGroup
        className={cn("flex items-center gap-2 cursor-text", className)}
        onMouseDown={() => setOpen(true)}
      >
        <Autocomplete.Input
          aria-label={label}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-neutral-400"
        />
        <Autocomplete.Trigger
          aria-label={`Show ${label} suggestions`}
          className="shrink-0 opacity-60 cursor-pointer"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </Autocomplete.Trigger>
      </Autocomplete.InputGroup>

      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={4} className="z-50 outline-hidden select-none">
          <Autocomplete.Popup className="min-w-[var(--anchor-width)] origin-[var(--transform-origin)] p-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg transition-[scale,opacity] duration-100 ease-out data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
            <Autocomplete.Empty>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No suggestions — what you type is kept as it is.
              </div>
            </Autocomplete.Empty>
            <Autocomplete.List className="relative max-h-64 overflow-y-auto scroll-py-1">
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className="truncate cursor-default py-1.5 pr-3 pl-2 rounded-lg text-xs outline-hidden select-none data-highlighted:bg-muted data-highlighted:text-foreground"
                >
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
