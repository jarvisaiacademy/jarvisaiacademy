"use client";

import React from "react";
import { PanelLeft } from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";

import { siteConfig } from "@/config/site";

interface SidebarHeaderProps {
  onToggle: () => void;
  onSearch?: () => void;
  onOpenLogin?: () => void;
  isMobile?: boolean;
  isDashboardOpen?: boolean;
}

export function SidebarHeader({
  onToggle,
  isMobile,
  isDashboardOpen,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3 text-foreground">
      <div className="flex flex-col min-w-0 pr-2 select-none">
        {isDashboardOpen ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white truncate">
                Admin Portal
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                HQ
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
              {siteConfig.name} Control
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white select-none leading-tight truncate">
              {siteConfig.name}
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none tracking-normal font-normal truncate mt-0.5">
              {siteConfig.tagline}
            </span>
          </>
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
  );
}

export default SidebarHeader;
