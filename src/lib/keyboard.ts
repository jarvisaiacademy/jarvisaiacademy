import type { ShortcutEntry } from "@/data/shortcuts";

/** Dispatched on window to open the shortcut guide from anywhere, e.g. a Settings row. */
export const OPEN_SHORTCUT_GUIDE_EVENT = "jarvis:shortcut-guide";

/**
 * True while focus sits in a text field. Single-key shortcuts check this so they
 * never swallow real typing.
 */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
  );
};

/** Whether a keydown event matches a registry entry's key spec. */
export function matchesShortcut(
  event: KeyboardEvent,
  entry: ShortcutEntry
): boolean {
  const mod = event.metaKey || event.ctrlKey;
  return entry.keys.some((spec) => {
    if (event.key.toLowerCase() !== spec.key) return false;
    // A plain key must not fire under a modifier, or Cmd+F would open the filter.
    return spec.mod ? mod : !mod && !event.altKey;
  });
}
