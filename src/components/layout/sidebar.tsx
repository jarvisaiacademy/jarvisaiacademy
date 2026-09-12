"use client";

import { motion } from "motion/react";
import { Settings } from "lucide-react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarPinned } from "./sidebar-pinned";
import { SidebarProjects } from "./sidebar-projects";
import { UserProfile } from "./user-profile";
import { SidebarLoginCTA } from "./sidebar-login-cta";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSection?: (section: string) => void;
  onNewChat?: () => void;
  onOpenLogin?: () => void;
  onOpenSettings?: () => void;
  isLoggedIn?: boolean;
  isMobile?: boolean;
}

export function Sidebar({
  isOpen,
  onToggle,
  onSelectSection,
  onNewChat,
  onOpenLogin,
  onOpenSettings,
  isLoggedIn = false,
  isMobile,
}: SidebarProps) {
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            aria-hidden="true"
          />
        )}
        <motion.aside
          initial={false}
          animate={{
            x: isOpen ? 0 : -280,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-white/5 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors"
        >
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <SidebarHeader onToggle={onToggle} />
            <SidebarNav
              onNewChat={onNewChat}
              onSelectSection={onSelectSection}
              onOpenLogin={onOpenLogin}
              isMobile={true}
            />
            <div className="h-px bg-neutral-200 dark:bg-white/5 mx-2 my-1" />
            <SidebarPinned />
            <div className="h-px bg-neutral-200 dark:bg-white/5 mx-2 my-1" />
            <SidebarProjects />
          </div>

          <div className="flex flex-col border-t border-neutral-200 dark:border-white/5">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
            >
              <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>Settings</span>
            </button>

            {isLoggedIn ? (
              <UserProfile />
            ) : (
              <SidebarLoginCTA onLoginClick={onOpenLogin} />
            )}
          </div>
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 260 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className={`relative flex flex-col justify-between h-screen bg-[#f9f9f9] dark:bg-[#171717] overflow-hidden shrink-0 select-none z-30 transition-colors ${
        isOpen ? "border-r border-neutral-200 dark:border-white/5" : "border-none"
      }`}
    >
      <div className="w-[260px] flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <SidebarHeader onToggle={onToggle} />
        <SidebarNav
          onNewChat={onNewChat}
          onSelectSection={onSelectSection}
          onOpenLogin={onOpenLogin}
          isMobile={false}
        />
        <div className="h-px bg-neutral-200 dark:bg-white/5 mx-2 my-1" />
        <SidebarPinned />
        <div className="h-px bg-neutral-200 dark:bg-white/5 mx-2 my-1" />
        <SidebarProjects />
      </div>
      <div className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
        >
          <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Settings</span>
        </button>

        {isLoggedIn ? (
          <UserProfile />
        ) : (
          <SidebarLoginCTA onLoginClick={onOpenLogin} />
        )}
      </div>
    </motion.aside>
  );
}
