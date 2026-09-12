"use client";

import React, { useState, useRef } from "react";
import {
  SquarePen,
  BookOpen,
  Zap,
  Sparkles,
  MessageSquareQuote,
  Award,
  HelpCircle,
} from "lucide-react";
import { DeepResearchPopover } from "./deep-research-popover";

interface SidebarNavProps {
  onNewChat?: () => void;
  onSelectSection?: (section: string) => void;
  onOpenLogin?: () => void;
  isMobile?: boolean;
}

export function SidebarNav({
  onNewChat,
  onSelectSection,
  onOpenLogin,
  isMobile,
}: SidebarNavProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const deepResearchRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleMouseEnterTrigger = () => {
    clearHideTimer();
    if (deepResearchRef.current) {
      setAnchorRect(deepResearchRef.current.getBoundingClientRect());
    }
    setIsPopoverOpen(true);
  };

  const handleMouseLeaveTrigger = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 180);
  };

  const handleMouseEnterPopover = () => {
    clearHideTimer();
  };

  const handleMouseLeavePopover = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 180);
  };

  return (
    <nav className="flex flex-col gap-1 px-2 py-1">
      {/* New chat button */}
      <button
        type="button"
        onClick={onNewChat}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-neutral-900 dark:text-white bg-neutral-200/80 dark:bg-[#212121] hover:bg-neutral-300/80 dark:hover:bg-[#2c2c2c] rounded-lg transition-all text-left shadow-xs cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <SquarePen className="w-4 h-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />
          <span>New chat</span>
        </div>
      </button>

      {/* Courses */}
      <button
        type="button"
        onClick={() => onSelectSection?.("courses")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
        <span>Courses</span>
      </button>

      {/* Super10 */}
      <button
        type="button"
        onClick={() => onSelectSection?.("super10")}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          <span>Super10</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
          Elite
        </span>
      </button>

      {/* Deep research with hover popover */}
      <div className="relative">
        <button
          ref={deepResearchRef}
          type="button"
          onClick={() => onSelectSection?.("deep_research")}
          onMouseEnter={handleMouseEnterTrigger}
          onMouseLeave={handleMouseLeaveTrigger}
          aria-haspopup="dialog"
          aria-expanded={isPopoverOpen}
          className="group flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors" />
            <span>Deep research</span>
          </div>
        </button>

        {!isMobile && (
          <DeepResearchPopover
            isOpen={isPopoverOpen}
            anchorRect={anchorRect}
            onMouseEnter={handleMouseEnterPopover}
            onMouseLeave={handleMouseLeavePopover}
            onLoginClick={() => {
              setIsPopoverOpen(false);
              onOpenLogin?.();
            }}
            onSignupClick={() => {
              setIsPopoverOpen(false);
              onOpenLogin?.();
            }}
          />
        )}
      </div>

      {/* Testimonials */}
      <button
        type="button"
        onClick={() => onSelectSection?.("testimonials")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <MessageSquareQuote className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
        <span>Testimonials</span>
      </button>

      {/* Certificate */}
      <button
        type="button"
        onClick={() => onSelectSection?.("certificate")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <Award className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
        <span>Certificate</span>
      </button>

      {/* Enquiry */}
      <button
        type="button"
        onClick={() => onSelectSection?.("enquiry")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
        <span>Enquiry</span>
      </button>
    </nav>
  );
}
