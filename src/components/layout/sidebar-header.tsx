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
      <div className="flex items-center gap-2.5 min-w-0 pr-2 select-none">
        {/* Decorative — the wordmark beside it already names the brand. */}
        <img
          src={siteConfig.logo}
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 shrink-0 object-contain"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white select-none leading-tight truncate">
            {siteConfig.name}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none tracking-normal font-normal truncate mt-0.5">
            {siteConfig.tagline}
          </span>
        </div>
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
