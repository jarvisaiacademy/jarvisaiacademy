"use client";

import React from "react";
import { PanelLeft } from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";

interface SidebarHeaderProps {
  onToggle: () => void;
  onSearch?: () => void;
  onOpenLogin?: () => void;
  isMobile?: boolean;
}

export function SidebarHeader({
  onToggle,
  isMobile,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3.5 text-foreground">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white select-none">
          Jarvis AI Academy
        </span>
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
