"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

export interface SearchHistoryPopoverProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  sidebarRight?: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function SearchHistoryPopover({
  isOpen,
  anchorRect,
  sidebarRight,
  onMouseEnter,
  onMouseLeave,
  onLoginClick,
  onSignupClick,
}: SearchHistoryPopoverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !anchorRect) return null;

  // Position floating card to the right of the sidebar, aligned with the trigger
  const top = Math.max(12, Math.min(window.innerHeight - 340, anchorRect.top - 16));
  const effectiveLeft = (sidebarRight ?? anchorRect.right) + 10;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ top: `${top}px`, left: `${effectiveLeft}px` }}
          className="fixed z-[70] pointer-events-auto select-none"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Invisible hover bridge between trigger and card to prevent flicker */}
          <div className="absolute top-0 -left-2 w-2 h-full pointer-events-auto" />

          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              x: -4,
              transition: { duration: 0.14, ease: "easeIn" },
            }}
            role="dialog"
            aria-labelledby="search-history-title"
            aria-describedby="search-history-desc"
            data-placement="right-of-sidebar"
            className="w-[316px] sm:w-[328px] bg-[#212121] border border-white/10 rounded-[22px] shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
          >
            {/* Top: Soft pastel blue/purple gradient hero block matching reference screenshot */}
            <div className="h-36 w-full bg-gradient-to-br from-[#8ba7f9] via-[#aca5fb] to-[#8db7fd] rounded-t-[22px]" />

            {/* Bottom: Dark charcoal content area */}
            <div className="p-5 flex flex-col gap-2.5 bg-[#212121] rounded-b-[22px]">
              <h3
                id="search-history-title"
                className="text-[16px] font-semibold text-white leading-snug tracking-tight"
              >
                Search your chat history
              </h3>

              <p
                id="search-history-desc"
                className="text-[13px] text-neutral-400 leading-relaxed font-normal"
              >
                Log in to save conversations, search past answers, and pick up where you left off.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 mt-0.5">
                {/* Primary Button: White "Log in" */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="py-2 px-5 rounded-full bg-white hover:bg-neutral-100 text-black text-[13px] font-semibold text-center transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  Log in
                </button>

                {/* Secondary Button: Dark Outlined "Sign up for free" */}
                <button
                  type="button"
                  onClick={onSignupClick || onLoginClick}
                  className="py-2 px-4 rounded-full bg-[#2f2f2f] hover:bg-[#383838] border border-white/10 text-white text-[13px] font-medium text-center transition-all cursor-pointer active:scale-[0.98] truncate"
                >
                  Sign up for free
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default SearchHistoryPopover;
