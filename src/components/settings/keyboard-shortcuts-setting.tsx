"use client";

import React from "react";
import { Keyboard, ChevronRight } from "lucide-react";
import { OPEN_SHORTCUT_GUIDE_EVENT } from "@/lib/keyboard";

export function KeyboardShortcutsSetting() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event(OPEN_SHORTCUT_GUIDE_EVENT))
      }
      aria-haspopup="dialog"
      className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
          <Keyboard className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground leading-snug">
            Keyboard shortcuts
          </span>
          <span className="text-xs text-muted-foreground leading-normal mt-0.5">
            Every shortcut — or press ? anywhere
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export default KeyboardShortcutsSetting;
