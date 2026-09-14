"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  Zap,
  Gift,
  Star,
  Award,
  LayoutDashboard,
  HelpCircle,
} from "lucide-react";

function HeroGradientObject({ itemKey }: { itemKey?: string }) {
  switch (itemKey) {
    case "dashboard":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[174px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-white/85 flex items-center justify-center text-blue-600 shadow-xs">
                <LayoutDashboard className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-semibold text-white tracking-tight">Metrics</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/30 text-white border border-emerald-300/40">
              LIVE
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-7 pt-1">
            <div className="w-2.5 bg-white/40 rounded-t h-2" />
            <div className="w-2.5 bg-white/55 rounded-t h-3.5" />
            <div className="w-2.5 bg-white/50 rounded-t h-3" />
            <div className="w-2.5 bg-white/75 rounded-t h-5" />
            <div className="w-2.5 bg-white rounded-t h-6" />
            <span className="text-[12px] font-extrabold text-white ml-2">+94%</span>
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-neutral-900 shadow-md text-[10px] font-semibold flex items-center gap-1 border border-white/60">
            <span>Real-time</span>
          </div>
        </div>
      );

    case "courses":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
            <span className="text-[10px] font-mono text-white/90 font-medium ml-1">fullstack-ai.ts</span>
          </div>
          <div className="flex flex-col gap-1 my-0.5">
            <div className="h-1.5 w-24 bg-white/80 rounded-full" />
            <div className="h-1.5 w-16 bg-white/50 rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-emerald-950 shadow-md text-[10px] font-semibold flex items-center gap-1 border border-white/60">
            <BookOpen className="w-2.5 h-2.5 text-emerald-600" />
            <span>60-Day Cohort</span>
          </div>
        </div>
      );

    case "super10":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-[9px] shadow-xs">
                ★
              </div>
              <span className="text-[11px] font-bold text-white tracking-tight">Super10</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/25 text-white border border-white/30">
              TOP 1%
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex -space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-white/90 border border-amber-300" />
              <div className="w-4 h-4 rounded-full bg-white/80 border border-amber-300" />
              <div className="w-4 h-4 rounded-full bg-white/70 border border-amber-300" />
              <div className="w-4 h-4 rounded-full bg-amber-300 border border-white flex items-center justify-center text-[8px] font-bold text-black">
                +7
              </div>
            </div>
            <span className="text-[10px] font-semibold text-white/90">10 Seats</span>
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-amber-950 shadow-md text-[10px] font-bold flex items-center gap-1 border border-white/60">
            <Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
            <span>100% Placement</span>
          </div>
        </div>
      );

    case "referral":
      return (
        <div className="relative flex flex-col gap-1 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-white/85 flex items-center justify-center text-emerald-600 shadow-xs">
              <Gift className="w-2.5 h-2.5" />
            </div>
            <span className="text-[11px] font-semibold text-white">Cash Bonus</span>
          </div>
          <div className="text-[18px] font-extrabold text-white tracking-tight leading-tight mt-0.5 flex items-baseline gap-1">
            ₹3,000 <span className="text-[10px] font-semibold text-white/80">/ student</span>
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-emerald-950 shadow-md text-[10px] font-bold flex items-center gap-1 border border-white/60">
            <span>Instant Reward</span>
          </div>
        </div>
      );

    case "testimonials":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-amber-300">
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <Star className="w-2.5 h-2.5 fill-amber-300" />
              <Star className="w-2.5 h-2.5 fill-amber-300" />
            </div>
            <span className="text-[11px] font-extrabold text-white">5.0 / 5.0</span>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="h-1.5 w-24 bg-white/80 rounded-full" />
            <div className="h-1.5 w-18 bg-white/50 rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-neutral-900 shadow-md text-[10px] font-semibold flex items-center gap-1 border border-white/60">
            <Award className="w-2.5 h-2.5 text-rose-500" />
            <span>Verified Alum</span>
          </div>
        </div>
      );

    case "certificate":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-white/85 flex items-center justify-center text-sky-600 shadow-xs">
              <Award className="w-2.5 h-2.5" />
            </div>
            <span className="text-[11px] font-semibold text-white">Jarvis Credential</span>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="h-1.5 w-24 bg-white/80 rounded-full" />
            <div className="h-1.5 w-14 bg-white/50 rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-sky-950 shadow-md text-[10px] font-bold flex items-center gap-1 border border-white/60">
            <span>Tamper-Proof</span>
          </div>
        </div>
      );

    case "enquiry":
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-white/85 flex items-center justify-center text-teal-600 shadow-xs">
              <HelpCircle className="w-2.5 h-2.5" />
            </div>
            <span className="text-[11px] font-semibold text-white">Admissions Desk</span>
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="h-1.5 w-24 bg-white/80 rounded-full" />
            <div className="h-1.5 w-16 bg-white/50 rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-teal-950 shadow-md text-[10px] font-bold flex items-center gap-1 border border-white/60">
            <span>1-on-1 Counseling</span>
          </div>
        </div>
      );

    case "new_chat":
    default:
      return (
        <div className="relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-[16px] bg-white/20 backdrop-blur-md border border-white/35 shadow-lg shadow-black/10 w-[176px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-white/85 flex items-center justify-center text-neutral-900 shadow-xs">
                <MessageSquare className="w-2.5 h-2.5 text-indigo-600" />
              </div>
              <span className="text-[11px] font-semibold text-white tracking-tight">AI Assistant</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-xs" />
          </div>
          <div className="flex flex-col gap-1 mt-0.5">
            <div className="h-1.5 w-24 bg-white/80 rounded-full" />
            <div className="h-1.5 w-16 bg-white/50 rounded-full" />
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-white/95 text-neutral-950 shadow-md text-[10px] font-semibold flex items-center gap-1 border border-white/60">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>Ask anything</span>
          </div>
        </div>
      );
  }
}

export interface SidebarHoverCardProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  sidebarRight?: number;
  title: string;
  description: string;
  gradientClass: string;
  itemKey?: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  /** Signed-in users have nothing to log into — hide the auth actions. */
  showActions?: boolean;
}

export function SidebarHoverCard({
  isOpen,
  anchorRect,
  sidebarRight,
  title,
  description,
  gradientClass,
  itemKey,
  onMouseEnter,
  onMouseLeave,
  onLoginClick,
  onSignupClick,
  primaryButtonText = "Log in",
  secondaryButtonText = "Sign up for free",
  showActions = true,
}: SidebarHoverCardProps) {
  const [mounted, setMounted] = useState(false);

  // Cache last active content so the exit animation doesn't abruptly collapse or flash empty
  const [cachedContent, setCachedContent] = useState({
    title,
    description,
    gradientClass,
    itemKey,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (title && description) {
      setCachedContent({ title, description, gradientClass, itemKey });
    }
  }, [title, description, gradientClass, itemKey]);

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
            {/* Top: Vibrant hero gradient block with light elements & glassmorphic object */}
            <div
              className={`relative h-36 w-full ${cachedContent.gradientClass} rounded-t-[22px] overflow-hidden flex items-center justify-center select-none`}
            >
              {/* Specular sheen across top */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />

              {/* Ambient glowing light orbs */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/20 rounded-full blur-xl pointer-events-none" />

              {/* Delicate concentric glass rings */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/20 pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/15 pointer-events-none" />

              {/* Sparkling light elements */}
              <svg
                className="absolute top-3.5 left-5 w-3.5 h-3.5 text-white/70 animate-pulse pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              <svg
                className="absolute bottom-4 right-6 w-2.5 h-2.5 text-white/60 pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              <svg
                className="absolute top-5 right-16 w-2 h-2 text-white/50 pointer-events-none"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>

              {/* Floating Hero Object */}
              <div className="relative z-10 drop-shadow-md transition-transform duration-300 hover:scale-105">
                <HeroGradientObject itemKey={cachedContent.itemKey} />
              </div>
            </div>

            {/* Bottom: Content area */}
            <div className="p-5 flex flex-col gap-2.5 bg-white dark:bg-[#212121] rounded-b-[22px]">
              <h3 className="text-[16px] font-semibold text-neutral-900 dark:text-white leading-snug tracking-tight">
                {cachedContent.title}
              </h3>

              <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                {cachedContent.description}
              </p>

              {/* Action Buttons */}
              {showActions && (
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default SidebarHoverCard;
