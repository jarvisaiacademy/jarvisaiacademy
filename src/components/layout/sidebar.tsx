"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
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
            <SidebarHeader
              onToggle={onToggle}
              onOpenLogin={onOpenLogin}
              isMobile={true}
            />
            <SidebarNav
              onNewChat={onNewChat}
              onSelectSection={onSelectSection}
              onOpenLogin={onOpenLogin}
              isMobile={true}
            />
          </div>

          <div className="flex flex-col border-t border-neutral-200 dark:border-white/5">
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
        <SidebarHeader
          onToggle={onToggle}
          onOpenLogin={onOpenLogin}
          isMobile={false}
        />
        <SidebarNav
          onNewChat={onNewChat}
          onSelectSection={onSelectSection}
          onOpenLogin={onOpenLogin}
          isMobile={false}
        />
      </div>
      <div className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
        {isLoggedIn ? (
          <UserProfile />
        ) : (
          <SidebarLoginCTA onLoginClick={onOpenLogin} />
        )}
      </div>
    </motion.aside>
  );
}
