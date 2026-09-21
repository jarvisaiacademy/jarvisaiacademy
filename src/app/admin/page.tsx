"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";

const TAB_STORAGE_KEY = "jarvis_admin_tab";

// Keyed by every DashboardTab, so adding a tab to that union without adding it
// here fails to compile. "cloud" is development-only — its content is gated on
// `canSeed`, so restoring it in production would render an empty dashboard.
const VALID_TABS: Record<DashboardTab, true> = {
  courses: true,
  teachers: true,
  knowledge: true,
  settings: true,
  users: true,
  assignments: true,
  analytics: true,
  cloud: true,
};

function isDashboardTab(value: string | null): value is DashboardTab {
  if (!value || !(value in VALID_TABS)) return false;
  return value !== "cloud" || process.env.NODE_ENV === "development";
}

/**
 * The dashboard owns its own URL so refreshing lands back on the dashboard rather
 * than on the chat. Auth lives in localStorage, which the server cannot read, so
 * the reveal happens one commit after hydration: server HTML and the first client
 * render both paint nothing, and the effects below show it or redirect. That leaves
 * a blank backdrop for a frame instead of a wrong surface, which is the whole point.
 *
 * firestore.rules is the real access control. This gate is UX, and the HTML it
 * stands in front of holds no admin data.
 */
export default function AdminRoute() {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<DashboardTab>("courses");

  // The stored tab is read before the dashboard first paints, so restoring it
  // costs no extra flash.
  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (isDashboardTab(stored)) setTab(stored);
    setMounted(true);
  }, []);

  const isAuthorized = !!user?.isAdmin;

  // Signed out, or signed in as a student: leave. After mount, because `user` is
  // only known on the client; navigating during render would fire on every attempt.
  // `replace`, not `push`, so Back does not bounce straight back here.
  useEffect(() => {
    if (mounted && !isAuthorized) router.replace("/");
  }, [mounted, isAuthorized, router]);

  const handleSelectTab = useCallback((next: DashboardTab) => {
    setTab(next);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // storage unavailable — the tab simply does not persist
    }
  }, []);

  const goHome = useCallback(() => router.push("/"), [router]);

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
          onSelectDashboardTab={handleSelectTab}
          onBackToChat={goHome}
        />

        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          <AdminDashboard
            activeTab={tab}
            onChangeTab={handleSelectTab}
            onBackToChat={goHome}
            sidebarOpen={isOpen}
            onToggleSidebar={toggle}
          />
        </main>
      </div>
    </ToastProvider>
  );
}
