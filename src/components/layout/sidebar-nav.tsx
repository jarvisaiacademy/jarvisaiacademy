"use client";

import {
  SquarePen,
  Library,
  Clock,
  Compass,
  MoreHorizontal,
} from "lucide-react";

interface SidebarNavProps {
  onNewChat?: () => void;
}

export function SidebarNav({ onNewChat }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2 py-1">
      {/* New chat button */}
      <button
        type="button"
        onClick={onNewChat}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white bg-[#212121] hover:bg-[#2c2c2c] rounded-lg transition-all text-left shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <SquarePen className="w-4 h-4 text-neutral-300 group-hover:text-white" />
          <span>New chat</span>
        </div>
      </button>

      {/* Library */}
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <Library className="w-4 h-4 text-neutral-400" />
        <span>Library</span>
      </button>

      {/* Scheduled */}
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <Clock className="w-4 h-4 text-neutral-400" />
        <span>Scheduled</span>
      </button>

      {/* Plugins */}
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <Compass className="w-4 h-4 text-neutral-400" />
        <span>Plugins</span>
      </button>

      {/* More */}
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <MoreHorizontal className="w-4 h-4 text-neutral-400" />
        <span>More</span>
      </button>
    </nav>
  );
}
