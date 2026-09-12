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
    <section
      aria-labelledby="sidebar-login-title"
      className={`border-t border-neutral-200 dark:border-white/10 px-3.5 pt-3.5 pb-4 bg-transparent ${className}`}
    >
      <h2
        id="sidebar-login-title"
        className="text-[13.5px] font-semibold text-neutral-900 dark:text-white leading-tight select-none"
      >
        Get responses tailored to you
      </h2>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1.5 select-none">
        Log in to get answers based on saved chats, plus create images and upload files.
      </p>

      <button
        type="button"
        onClick={onLoginClick}
        className="w-full mt-3.5 py-2 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-[#2a2a2a] dark:hover:bg-[#343434] dark:active:bg-[#202020] border border-neutral-200 dark:border-white/10 text-[13px] font-medium text-center transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neutral-400"
      >
        Log in
      </button>
    </section>
  );
}

export default SidebarLoginCTA;
