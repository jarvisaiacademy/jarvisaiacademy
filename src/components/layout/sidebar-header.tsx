"use client";

import { PanelLeft, Search } from "lucide-react";

interface SidebarHeaderProps {
  onToggle: () => void;
  onSearch?: () => void;
}

export function SidebarHeader({ onToggle, onSearch }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-3.5 text-neutral-200">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-base tracking-tight text-white select-none">
          Jarvis AI Academy
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          aria-label="Close sidebar"
          title="Close sidebar (Cmd+B)"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
