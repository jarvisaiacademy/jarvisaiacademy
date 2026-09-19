"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { UserProfile } from "./user-profile";
import { SidebarLoginCTA } from "./sidebar-login-cta";
import { SocialLinks } from "@/components/common/social-links";

import { User } from "@/providers/auth-provider";
import { DashboardSidebarNav, DashboardTab } from "./dashboard-sidebar-nav";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectSection?: (section: string) => void;
  onNewChat?: () => void;
  onOpenLogin?: () => void;
  onOpenSettings?: () => void;
  onOpenDashboard?: () => void;
  onOpenStudentView?: (view: "profile" | "courses") => void;
  onOpenLearning?: () => void;
  activeItem?: string | null;
  isLoggedIn?: boolean;
  user?: User | null;
  onLogout?: () => void;
  isMobile?: boolean;
  isDashboardOpen?: boolean;
  activeDashboardTab?: DashboardTab;
  onSelectDashboardTab?: (tab: DashboardTab) => void;
  onBackToChat?: () => void;
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
  onOpenLearning,
  activeItem,
  isLoggedIn = false,
  user,
  onLogout,
  isMobile,
  isDashboardOpen = false,
  activeDashboardTab = "courses",
  onSelectDashboardTab,
  onBackToChat,
}: SidebarProps) {
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
          key="sidebar-drawer"
          initial={false}
          animate={{
            x: isOpen ? 0 : -280,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-white/5 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors"
        >
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <SidebarHeader
              onToggle={onToggle}
              onOpenLogin={onOpenLogin}
              isMobile={true}
              isDashboardOpen={isDashboardOpen}
            />
            {isDashboardOpen ? (
              <DashboardSidebarNav
                activeTab={activeDashboardTab}
                onSelectTab={(tab) => {
                  onSelectDashboardTab?.(tab);
                  onToggle();
                }}
                onBackToChat={() => {
                  onBackToChat?.();
                  onToggle();
                }}
                isMobile={true}
              />
            ) : (
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
                onOpenLearning={() => {
                  onOpenLearning?.();
                  onToggle();
                }}
                activeItem={activeItem}
                isMobile={true}
              />
            )}
          </div>

          <div suppressHydrationWarning className="flex flex-col border-t border-neutral-200 dark:border-white/5">
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
      key="sidebar-docked"
      initial={false}
      // Motion only writes the properties named in `animate`. Without the
      // explicit `x`, the drawer's `translateX(-280px)` survives on this node
      // and parks the docked sidebar 280px off-screen while it still occupies
      // its full width — the "empty space" bug.
      animate={{ width: isOpen ? 260 : 0, x: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      // `hidden md:flex`, not `flex`: `useSidebar` only learns it is on a phone
      // after its mount effect, so this docked branch paints in flow for one
      // frame first — holding its 260px, squeezing the chat, then dropping to 0
      // when the drawer takes over. That jump was the whole mobile layout shift.
      className={`relative hidden md:flex flex-col justify-between h-screen bg-[#f9f9f9] dark:bg-[#171717] overflow-hidden shrink-0 select-none z-30 transition-colors ${
        isOpen ? "border-r border-neutral-200 dark:border-white/5" : "border-none"
      }`}
    >
      <div className="w-[260px] flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <SidebarHeader
          onToggle={onToggle}
          onOpenLogin={onOpenLogin}
          isMobile={false}
          isDashboardOpen={isDashboardOpen}
        />
        {isDashboardOpen ? (
          <DashboardSidebarNav
            activeTab={activeDashboardTab}
            onSelectTab={(tab) => onSelectDashboardTab?.(tab)}
            onBackToChat={() => onBackToChat?.()}
            isMobile={false}
          />
        ) : (
        <SidebarNav
          onNewChat={onNewChat}
          onSelectSection={onSelectSection}
          onOpenLogin={onOpenLogin}
          onOpenDashboard={onOpenDashboard}
          onOpenStudentView={onOpenStudentView}
          onOpenLearning={onOpenLearning}
          activeItem={activeItem}
          isMobile={false}
        />
        )}
      </div>
      <div suppressHydrationWarning className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
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
        <div className="flex items-center justify-center pt-2 pb-3.5">
          <SocialLinks />
        </div>
      </div>
    </motion.aside>
  );
}
