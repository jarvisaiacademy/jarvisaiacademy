export const SHORTCUT_GROUPS = [
  { id: "global", label: "Anywhere" },
  { id: "admin", label: "Admin dashboard" },
] as const;

export type ShortcutGroupId = (typeof SHORTCUT_GROUPS)[number]["id"];

export interface ShortcutEntry {
  id: string;
  group: ShortcutGroupId;
  /** Printed as <kbd> chips, e.g. ["⌘", "B"]. */
  tokens: string[];
  /** KeyboardEvent keys that fire it; `mod` also requires ⌘ on macOS, Ctrl elsewhere. */
  keys: { key: string; mod?: boolean }[];
  description: string;
}

/**
 * Every shortcut the app responds to. The guide renders from this list and the
 * handlers match against it, so the two cannot drift apart.
 */
export const SHORTCUTS: ShortcutEntry[] = [
  {
    id: "guide",
    group: "global",
    tokens: ["?"],
    keys: [{ key: "?" }],
    description: "Open this shortcut guide",
  },
  {
    id: "dismiss",
    group: "global",
    tokens: ["Esc"],
    keys: [{ key: "escape" }],
    description: "Close the guide, a dialog or an open card",
  },
  {
    id: "sidebar",
    group: "global",
    tokens: ["⌘", "B"],
    keys: [{ key: "b", mod: true }],
    description: "Show or hide the sidebar (Ctrl+B on Windows and Linux)",
  },
  {
    id: "search",
    group: "admin",
    tokens: ["/"],
    keys: [{ key: "/" }],
    description: "Focus the student search box",
  },
  {
    id: "filter",
    group: "admin",
    tokens: ["F"],
    keys: [{ key: "f" }],
    description: "Open the status filter",
  },
];

export const shortcutById = (id: string): ShortcutEntry =>
  SHORTCUTS.find((entry) => entry.id === id)!;
