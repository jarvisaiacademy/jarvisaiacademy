"use client";

import React from "react";
import { PanelLeft } from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { UserProfile } from "@/components/layout/user-profile";
import { useAuth } from "@/providers/auth-provider";

interface AdminHeaderProps {
  sidebarOpen?: boolean;
  /** Omitted on a page with no sidebar to open, which therefore renders no toggle. */
  onToggleSidebar?: () => void;
  /** Centred page title. Defaults to the admin label. */
  title?: string;
}

/**
 * The dashboard's own top bar — "Admin Control Center", the theme control and the identity.
 *
 * Shared by the tab list and by a page that is not the tab list (a course detail), so the two
 * carry one header rather than a copy each: the sidebar toggle is the only way to open the
 * sidebar on mobile, so a page that forgot it would be a page with no navigation at all.
 */
export function AdminHeader({
  sidebarOpen = true,
  onToggleSidebar,
  title = "Admin Control Center",
}: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between px-3 sm:px-6 h-14 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 select-none">
      <div className="flex flex-1 items-center min-w-[40px]">
        {!sidebarOpen && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
            title="Open sidebar (Cmd+B)"
            className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-500 md:hover:text-neutral-900 md:hover:bg-neutral-200/60 md:dark:text-neutral-400 md:dark:hover:text-white md:dark:hover:bg-white/10 shadow-xs md:shadow-none shrink-0"
          >
            <span className="md:hidden flex items-center justify-center">
              <MobileMenuIcon className="w-4 h-4" />
            </span>
            <span className="hidden md:flex items-center justify-center">
              <PanelLeft className="w-4 h-4" />
            </span>
          </button>
        )}
      </div>

      <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white text-center">
        {title}
      </h1>

      {/* The theme control and the identity live here, as they do in the guest header. Both
          outer groups are flex-1 so the title stays centred whatever width the controls take.
          The identity is repeated from the sidebar footer because that footer disappears when
          the sidebar is collapsed. */}
      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2.5 min-w-[40px]">
        <ThemeSwitcher className="shrink-0" />
        {user && <UserProfile user={user} onLogout={logout} variant="compact" />}
      </div>
    </header>
  );
}

export default AdminHeader;
