"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface DeepResearchPopoverProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function DeepResearchPopover({
  isOpen,
  anchorRect,
  onMouseEnter,
  onMouseLeave,
  onLoginClick,
  onSignupClick,
}: DeepResearchPopoverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !anchorRect) return null;

  // Calculate position immediately to the right of the trigger/sidebar
  const top = Math.max(16, Math.min(window.innerHeight - 340, anchorRect.top - 24));
  const left = anchorRect.right + 8;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ top: `${top}px`, left: `${left}px` }}
          className="fixed z-[70] pointer-events-auto select-none"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Invisible hover bridge between trigger and card */}
          <div className="absolute top-0 -left-3 w-3 h-full pointer-events-auto" />

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
            aria-labelledby="deep-research-title"
            aria-describedby="deep-research-desc"
            data-placement="right-of-sidebar"
            className="w-[320px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col"
          >
            {/* Decorative Deep Research Gradient / Hero Area */}
            <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 p-4 flex flex-col justify-between border-b border-border/50">
              {/* Radial glow highlight */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-violet-500/20 blur-xl pointer-events-none" />

              {/* Top badges */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-300 animate-pulse" />
                  <span>Deep Research</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Jarvis AI</span>
              </div>

              {/* Visual geometric preview in hero */}
              <div className="relative z-10 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white tracking-tight">
                    Multi-step Synthesis
                  </span>
                  <span className="text-[10px] text-neutral-300">
                    Autonomous web & curriculum agent
                  </span>
                </div>
              </div>
            </div>

            {/* Padded Content Section */}
            <div className="p-4 flex flex-col gap-2.5">
              <h3
                id="deep-research-title"
                className="text-sm font-semibold text-foreground leading-snug"
              >
                Turn questions into research
              </h3>

              <p
                id="deep-research-desc"
                className="text-xs text-muted-foreground leading-relaxed"
              >
                Log in to run multi-step research, compare technical sources, and save cited Jarvis Academy engineering roadmaps to revisit later.
              </p>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/50">
                {/* Primary Button: Log in */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="flex-1 py-2 px-3.5 rounded-full bg-foreground text-background hover:opacity-90 active:scale-[0.98] text-xs font-semibold text-center transition-all shadow-sm cursor-pointer"
                >
                  Log in
                </button>

                {/* Secondary Button: Sign up for free */}
                <button
                  type="button"
                  onClick={onSignupClick || onLoginClick}
                  className="flex-1 py-2 px-3 rounded-full bg-transparent hover:bg-muted active:scale-[0.98] border border-border text-foreground text-xs font-medium text-center transition-all cursor-pointer truncate"
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

export default DeepResearchPopover;
