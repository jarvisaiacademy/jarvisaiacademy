"use client";

import React, { useState, useRef } from "react";
import { PanelLeft, Search } from "lucide-react";
import { SearchHistoryPopover } from "./search-history-popover";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";

interface SidebarHeaderProps {
  onToggle: () => void;
  onSearch?: () => void;
  onOpenLogin?: () => void;
  isMobile?: boolean;
}

export function SidebarHeader({
  onToggle,
  onSearch,
  onOpenLogin,
  isMobile,
}: SidebarHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [sidebarRight, setSidebarRight] = useState<number | undefined>(undefined);
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearHideTimer();
    if (searchBtnRef.current) {
      setAnchorRect(searchBtnRef.current.getBoundingClientRect());
      const asideEl = searchBtnRef.current.closest("aside");
      if (asideEl) {
        setSidebarRight(asideEl.getBoundingClientRect().right);
      }
    }
    setIsPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 130);
  };

  const handleMouseEnterPopover = () => {
    clearHideTimer();
  };

  const handleMouseLeavePopover = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setIsPopoverOpen(false);
    }, 130);
  };

  return (
    <div className="flex items-center justify-between px-3 py-3.5 text-foreground">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white select-none">
          Jarvis AI Academy
        </span>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            ref={searchBtnRef}
            type="button"
            onClick={onSearch || onOpenLogin}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label="Search chat history"
            title="Search chats"
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {!isMobile && (
            <SearchHistoryPopover
              isOpen={isPopoverOpen}
              anchorRect={anchorRect}
              sidebarRight={sidebarRight}
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

        <button
          type="button"
          onClick={onToggle}
          aria-label="Close sidebar"
          title="Close sidebar (Cmd+B)"
          className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isMobile ? (
            <MobileMenuIcon className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
