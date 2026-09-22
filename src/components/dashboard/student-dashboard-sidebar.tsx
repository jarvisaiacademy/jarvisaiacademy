"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "@/components/layout/sidebar-header";
import { UserProfile } from "@/components/layout/user-profile";
import { SocialLinks } from "@/components/common/social-links";
import { useAuth } from "@/providers/auth-provider";
import { StudentSidebarNav } from "./student-sidebar-nav";
import { type StudentTab } from "./student-shell";

interface StudentDashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  onBackToChat: () => void;
}

/**
 * The student dashboard's sidebar — same visual chrome as the main Sidebar
 * but renders StudentSidebarNav instead of DashboardSidebarNav.
 */
export function StudentDashboardSidebar({
  isOpen,
  onToggle,
  isMobile,
  activeTab,
  onSelectTab,
  onBackToChat,
}: StudentDashboardSidebarProps) {
  const { user, isLoggedIn, logout } = useAuth();

  const nav = (
    <StudentSidebarNav
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onBackToChat={onBackToChat}
    />
  );

  const footer = isLoggedIn ? (
    <UserProfile user={user} onProfileClick={() => onSelectTab("profile")} onLogout={logout} />
  ) : null;

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            onClick={onToggle}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            aria-hidden="true"
          />
        )}
        <motion.aside
          key="student-sidebar-drawer"
          initial={false}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-white/5 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors"
        >
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <SidebarHeader onToggle={onToggle} isMobile={true} />
            {nav}
          </div>
          <div suppressHydrationWarning className="flex flex-col border-t border-neutral-200 dark:border-white/5">
            {footer}
            <div className="flex items-center justify-center pt-2 pb-3">
              <SocialLinks />
            </div>
          </div>
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      key="student-sidebar-docked"
      initial={false}
      animate={{ width: isOpen ? 260 : 0, x: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className={`relative hidden md:flex flex-col justify-between h-screen bg-[#f9f9f9] dark:bg-[#171717] overflow-hidden shrink-0 select-none z-30 transition-colors ${
        isOpen ? "border-r border-neutral-200 dark:border-white/5" : "border-none"
      }`}
    >
      <div className="w-[260px] flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <SidebarHeader onToggle={onToggle} isMobile={false} />
        {nav}
      </div>
      <div suppressHydrationWarning className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
        {footer}
        <div className="flex items-center justify-center pt-2 pb-3.5">
          <SocialLinks />
        </div>
      </div>
    </motion.aside>
  );
}
