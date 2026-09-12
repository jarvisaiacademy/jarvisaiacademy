"use client";

import { Store } from "lucide-react";

interface UserProfileProps {
  name?: string;
  plan?: string;
  initials?: string;
  onProfileClick?: () => void;
  onStoreClick?: () => void;
}

export function UserProfile({
  name = "rajx_sarwade",
  plan = "Go",
  initials = "RA",
  onProfileClick,
  onStoreClick,
}: UserProfileProps) {
  return (
    <div className="flex items-center justify-between p-3 border-t border-white/5 bg-[#171717]">
      <button
        type="button"
        onClick={onProfileClick}
        className="flex items-center gap-2.5 min-w-0 p-1 -m-1 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700 text-neutral-200 text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-white truncate">{name}</span>
          <span className="text-[11px] text-neutral-400 leading-none">{plan}</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onStoreClick}
        aria-label="Explore GPTs / Store"
        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Store className="w-4 h-4" />
      </button>
    </div>
  );
}
