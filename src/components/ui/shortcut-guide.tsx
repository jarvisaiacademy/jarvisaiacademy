"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SHORTCUTS, SHORTCUT_GROUPS, shortcutById } from "@/data/shortcuts";
import {
  OPEN_SHORTCUT_GUIDE_EVENT,
  isTypingTarget,
  matchesShortcut,
} from "@/lib/keyboard";

/**
 * The app's shortcut cheatsheet. Mounted once in the root layout, so `?` opens it
 * on every route and the Settings row can open the same instance via the event.
 */
export function ShortcutGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const openGuide = () => setIsOpen(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcutById("guide"))) {
        if (isTypingTarget(event.target)) return;
        event.preventDefault();
        setIsOpen(true);
        return;
      }
      if (matchesShortcut(event, shortcutById("dismiss"))) setIsOpen(false);
    };

    window.addEventListener(OPEN_SHORTCUT_GUIDE_EVENT, openGuide);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener(OPEN_SHORTCUT_GUIDE_EVENT, openGuide);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Move focus into the dialog so Escape and screen readers land somewhere sane,
  // then hand it back to whatever opened the guide.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* ponytail: no focus trap. The dialog holds one focusable control, and no
              trap utility exists in this repo. Add one if it grows form controls. */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-guide-title"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-[440px] max-h-[85vh] overflow-y-auto no-scrollbar bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl z-10 text-neutral-900 dark:text-neutral-100 focus:outline-hidden transition-colors"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close shortcut guide"
              className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              id="shortcut-guide-title"
              className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white mb-1"
            >
              Keyboard shortcuts
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-5 pr-8">
              Shortcuts are skipped while you are typing in a field.
            </p>

            <div className="flex flex-col gap-5">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.id} className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {group.label}
                  </h3>
                  <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-white/10 border-y border-neutral-200 dark:border-white/10">
                    {SHORTCUTS.filter((s) => s.group === group.id).map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-4 py-2.5"
                      >
                        <span className="text-xs text-neutral-700 dark:text-neutral-300">
                          {s.description}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          {s.tokens.map((token) => (
                            <kbd
                              key={token}
                              className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-md border border-neutral-200 dark:border-white/15 bg-neutral-100 dark:bg-white/5 text-[11px] font-medium font-mono text-neutral-600 dark:text-neutral-300"
                            >
                              {token}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ShortcutGuide;
