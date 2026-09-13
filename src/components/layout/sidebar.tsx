"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { UserProfile } from "./user-profile";
import { SidebarLoginCTA } from "./sidebar-login-cta";
import { ThemeSwitcher } from "./theme-switcher";

import { User } from "@/providers/auth-provider";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSection?: (section: string) => void;
  onNewChat?: () => void;
  onOpenLogin?: () => void;
  onOpenSettings?: () => void;
  onOpenDashboard?: () => void;
  isLoggedIn?: boolean;
  user?: User | null;
  onLogout?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  isOpen,
  onToggle,
  onSelectSection,
  onNewChat,
  onOpenLogin,
  onOpenSettings,
  onOpenDashboard,
  isLoggedIn = false,
  user,
  onLogout,
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
              onNewChat={() => {
                onNewChat?.();
                onToggle();
              }}
              onSelectSection={onSelectSection}
              onOpenLogin={onOpenLogin}
              onOpenDashboard={() => {
                onOpenDashboard?.();
                onToggle();
              }}
              isMobile={true}
            />
          </div>

          <div suppressHydrationWarning className="flex flex-col border-t border-neutral-200 dark:border-white/5">
            <ThemeSwitcher />
            {isLoggedIn ? (
              <UserProfile
                user={user}
                onLogout={onLogout}
                onProfileClick={onOpenSettings}
              />
            ) : (
              <SidebarLoginCTA onLoginClick={onOpenLogin} />
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 pt-1 pb-3 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none">
              <button
                type="button"
                onClick={() => {
                  onSelectSection?.("terms");
                  onToggle();
                }}
                className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
              >
                Terms & Cond.
              </button>
              <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
              <button
                type="button"
                onClick={() => {
                  onSelectSection?.("privacy");
                  onToggle();
                }}
                className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
              <button
                type="button"
                onClick={() => {
                  onSelectSection?.("payment_terms");
                  onToggle();
                }}
                className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
              >
                Payment Terms
              </button>
            </div>
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
          onOpenDashboard={onOpenDashboard}
          isMobile={false}
        />
      </div>
      <div suppressHydrationWarning className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
        <ThemeSwitcher />
        {isLoggedIn ? (
          <UserProfile
            user={user}
            onLogout={onLogout}
            onProfileClick={onOpenSettings}
          />
        ) : (
          <SidebarLoginCTA onLoginClick={onOpenLogin} />
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 pt-1 pb-3.5 text-[11px] text-neutral-400 dark:text-neutral-500 font-normal select-none">
          <button
            type="button"
            onClick={() => onSelectSection?.("terms")}
            className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Terms & Cond.
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
          <button
            type="button"
            onClick={() => onSelectSection?.("privacy")}
            className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
          <button
            type="button"
            onClick={() => onSelectSection?.("payment_terms")}
            className="hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Payment Terms
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
