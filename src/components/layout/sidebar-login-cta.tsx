"use client";

import React from "react";

export interface SidebarLoginCTAProps {
  onLoginClick?: () => void;
  className?: string;
}

export function SidebarLoginCTA({
  onLoginClick,
  className = "",
}: SidebarLoginCTAProps) {
  return (
    <div className={`p-3 bg-transparent ${className}`}>
      <button
        type="button"
        onClick={onLoginClick}
        className="w-full py-2.5 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-[#2a2a2a] dark:hover:bg-[#343434] dark:active:bg-[#202020] border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-center transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400"
      >
        Log in
      </button>
    </div>
  );
}

export default SidebarLoginCTA;
