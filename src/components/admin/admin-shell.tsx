"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";

const TAB_STORAGE_KEY = "jarvis_admin_tab";

// Keyed by every DashboardTab, so adding a tab to that union without adding it
// here fails to compile. "cloud" is development-only — its content is gated on
// `canSeed`, so restoring it in production would render an empty dashboard.
const VALID_TABS: Record<DashboardTab, true> = {
  home: true,
  admins: true,
  teachers: true,
  students: true,
  courses: true,
  knowledge: true,
  settings: true,
  users: true,
  analytics: true,
  cloud: true,
};

function isDashboardTab(value: string | null): value is DashboardTab {
  if (!value || !(value in VALID_TABS)) return false;
  return value !== "cloud" || process.env.NODE_ENV === "development";
}

/** What the shell hands its page: the chrome's state, so the page can drive it. */
export interface AdminShellState {
  activeTab: DashboardTab;
  /** Show a tab in place. Only correct on the tab list, which is where the panels live. */
  onSelectTab: (tab: DashboardTab) => void;
  /** Show a tab, going to the tab list first — for a route that is not the tab list. */
  onNavigateTab: (tab: DashboardTab) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onBackToChat: () => void;
}

interface AdminShellProps {
  /** The tab a session with no remembered tab opens on. */
  defaultTab: DashboardTab;
  /**
   * Whether to reopen the tab this session last used. True for the tab list, which is what
   * "remember my tab" means; false for a page that belongs to one tab, where restoring
   * another would highlight a panel that is not on screen.
   */
  restoreTab?: boolean;
  children: (shell: AdminShellState) => React.ReactNode;
}

/**
 * The dashboard's frame: the access gate, the sidebar and the open tab.
 *
 * Every route under `/admin` renders through this, so there is one gate rather than one per
 * page — a second copy is a second place to get authorization wrong. The tab is session state
 * rather than a URL segment because the dashboard swaps panels without navigating, and a tab
 * click is what puts you back on `/admin` from a page that is not the tab list.
 *
 * Auth lives in localStorage, which the server cannot read, so the reveal happens one commit
 * after hydration: server HTML and the first client render both paint nothing, and the effects
 * below show it or redirect. That leaves a blank backdrop for a frame instead of a wrong
 * surface, which is the whole point.
 *
 * firestore.rules is the real access control. This gate is UX, and the HTML it
 * stands in front of holds no admin data.
 */
export function AdminShell({ defaultTab, restoreTab = true, children }: AdminShellProps) {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<DashboardTab>(defaultTab);

  // The stored tab is read before the dashboard first paints, so restoring it
  // costs no extra flash.
  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (restoreTab && isDashboardTab(stored)) setTab(stored);
    setMounted(true);
  }, [restoreTab]);

  const isAuthorized = !!user?.isAdmin;

  // Signed out, or signed in as a student: leave. After mount, because `user` is
  // only known on the client; navigating during render would fire on every attempt.
  // `replace`, not `push`, so Back does not bounce straight back here.
  useEffect(() => {
    if (mounted && !isAuthorized) router.replace("/");
  }, [mounted, isAuthorized, router]);

  const handleSelectTab = useCallback(
    (next: DashboardTab) => {
      setTab(next);
      try {
        sessionStorage.setItem(TAB_STORAGE_KEY, next);
      } catch {
        // storage unavailable — the tab simply does not persist
      }
    },
    []
  );

  const goHome = useCallback(() => router.push("/"), [router]);

  // The tab list is `/admin`, so choosing a tab from anywhere else has to go there. The push is
  // skipped when already there, or every tab click would stack another identical history entry.
  const handleSidebarTab = useCallback(
    (next: DashboardTab) => {
      handleSelectTab(next);
      if (pathname !== "/admin") router.push("/admin");
    },
    [handleSelectTab, pathname, router]
  );

  if (!mounted || !isAuthorized) return null;

  return (
    <ToastProvider>
      <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-[#9d5932] selection:text-white transition-colors duration-150">
        <Sidebar
          isOpen={isOpen}
          onToggle={toggle}
          isMobile={isMobile}
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={logout}
          // The identity chip already means "open the dashboard", and this is it.
          onOpenProfile={() => {}}
          isDashboardOpen
          activeDashboardTab={tab}
          onSelectDashboardTab={handleSidebarTab}
          onBackToChat={goHome}
        />

        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          {children({
            activeTab: tab,
            onSelectTab: handleSelectTab,
            onNavigateTab: handleSidebarTab,
            sidebarOpen: isOpen,
            onToggleSidebar: toggle,
            onBackToChat: goHome,
          })}
        </main>
      </div>
    </ToastProvider>
  );
}
