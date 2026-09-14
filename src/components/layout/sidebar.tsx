"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { UserProfile } from "./user-profile";
import { SidebarLoginCTA } from "./sidebar-login-cta";
import { ThemeSwitcher } from "./theme-switcher";
import { SocialLinks } from "@/components/common/social-links";

import { User } from "@/providers/auth-provider";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSection?: (section: string) => void;
  onNewChat?: () => void;
  onOpenLogin?: () => void;
  onOpenSettings?: () => void;
  onOpenDashboard?: () => void;
  onOpenStudentView?: (view: "profile" | "courses") => void;
  activeItem?: string | null;
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
  onOpenStudentView,
  activeItem,
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
          key="sidebar-drawer"
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
              onOpenStudentView={(view) => {
                onOpenStudentView?.(view);
                onToggle();
              }}
              activeItem={activeItem}
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
              <div className="guest-cta-block">
                <SidebarLoginCTA onLoginClick={onOpenLogin} />
              </div>
            )}
            <div className="flex items-center justify-center pt-2 pb-1">
              <SocialLinks />
            </div>
            <div className="flex flex-nowrap items-center justify-center gap-x-1.5 px-2 pt-1 pb-3 text-[10px] text-neutral-400 dark:text-neutral-500 font-normal select-none">
              <button
                type="button"
                onClick={() => {
                  onSelectSection?.("terms");
                  onToggle();
                }}
                className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
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
                className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
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
                className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
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
      key="sidebar-docked"
      initial={false}
      // Motion only writes the properties named in `animate`. Without the
      // explicit `x`, the drawer's `translateX(-280px)` survives on this node
      // and parks the docked sidebar 280px off-screen while it still occupies
      // its full width — the "empty space" bug.
      animate={{ width: isOpen ? 260 : 0, x: 0 }}
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
          onOpenStudentView={onOpenStudentView}
          activeItem={activeItem}
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
          <div className="guest-cta-block">
            <SidebarLoginCTA onLoginClick={onOpenLogin} />
          </div>
        )}
        <div className="flex items-center justify-center pt-2 pb-1">
          <SocialLinks />
        </div>
        <div className="flex flex-nowrap items-center justify-center gap-x-1.5 px-2 pt-1 pb-3.5 text-[10px] text-neutral-400 dark:text-neutral-500 font-normal select-none">
          <button
            type="button"
            onClick={() => onSelectSection?.("terms")}
            className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Terms & Cond.
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
          <button
            type="button"
            onClick={() => onSelectSection?.("privacy")}
            className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
          <button
            type="button"
            onClick={() => onSelectSection?.("payment_terms")}
            className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
          >
            Payment Terms
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
