"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

export interface SidebarHoverCardProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  sidebarRight?: number;
  title: string;
  description: string;
  gradientClass: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

export function SidebarHoverCard({
  isOpen,
  anchorRect,
  sidebarRight,
  title,
  description,
  gradientClass,
  onMouseEnter,
  onMouseLeave,
  onLoginClick,
  onSignupClick,
  primaryButtonText = "Log in",
  secondaryButtonText = "Sign up for free",
}: SidebarHoverCardProps) {
  const [mounted, setMounted] = useState(false);

  // Cache last active content so the exit animation doesn't abruptly collapse or flash empty
  const [cachedContent, setCachedContent] = useState({
    title,
    description,
    gradientClass,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (title && description) {
      setCachedContent({ title, description, gradientClass });
    }
  }, [title, description, gradientClass]);

  if (!mounted || !anchorRect) return null;

  // Position floating card to the right of the sidebar, vertically aligned with the trigger
  const top = Math.max(12, Math.min(window.innerHeight - 340, anchorRect.top - 16));
  const effectiveLeft = (sidebarRight ?? anchorRect.right) + 8;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ top: `${top}px`, left: `${effectiveLeft}px` }}
          className="fixed z-[70] pointer-events-auto select-none"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Narrow hover bridge ONLY spanning the 8px gap between sidebar border and card - never overlaps sidebar */}
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
            aria-label={cachedContent.title}
            data-placement="right-of-sidebar"
            className="w-[316px] sm:w-[328px] bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 rounded-[22px] shadow-2xl shadow-black/20 dark:shadow-black/70 overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Top: Vibrant pastel/hero gradient block */}
            <div className={`h-36 w-full ${cachedContent.gradientClass} rounded-t-[22px]`} />

            {/* Bottom: Content area */}
            <div className="p-5 flex flex-col gap-2.5 bg-white dark:bg-[#212121] rounded-b-[22px]">
              <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-white leading-snug tracking-tight">
                {cachedContent.title}
              </h3>

              <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                {cachedContent.description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 mt-0.5">
                {/* Primary Button */}
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="py-2 px-5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black text-[13px] font-semibold text-center transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  {primaryButtonText}
                </button>

                {/* Secondary Button */}
                <button
                  type="button"
                  onClick={onSignupClick || onLoginClick}
                  className="py-2 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-900 dark:bg-[#2f2f2f] dark:hover:bg-[#383838] dark:border-white/10 dark:text-white text-[13px] font-medium text-center transition-all cursor-pointer active:scale-[0.98] truncate"
                >
                  {secondaryButtonText}
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

export default SidebarHoverCard;
