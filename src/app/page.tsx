"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { SettingsPage } from "@/components/settings/settings-page";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { StudentPanel, type StudentView } from "@/components/student/student-panel";
import { MyLearningPage } from "@/components/learning/my-learning-page";
import { DASHBOARD_TABS, DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";

/**
 * Where the open admin view is remembered across a refresh.
 *
 * Not in the URL: `/?view=admin` would survive the refresh too, but it advertises that an admin
 * surface exists and what its tabs are called, to anyone who reads the address bar or is handed
 * the link. sessionStorage keeps it out of the URL and dies with the tab, so it covers the
 * refresh without making every later visit to `/` land an admin in the dashboard.
 *
 * This is not access control. The dashboard draws only for `user?.isAdmin`, and the data behind
 * it is gated by `firestore.rules` — this key only decides which view to draw.
 */
const DASHBOARD_VIEW_KEY = "jarvis:admin-view";

export default function Home() {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout, clearAuthError } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [studentView, setStudentView] = useState<StudentView | null>(null);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>("courses");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  // Which sidebar section was last opened. Kept apart from `activeTopic`
  // because ChatCanvas clears that one once it has handled the topic — this
  // one has to outlive it to keep the nav item highlighted.
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  // The public course pages hand the conversation over through the URL: `?topic=`
  // for a programme or section, `?q=` for a question an inline link carried. Read
  // from `location` rather than `useSearchParams`, which would need a Suspense
  // boundary and make this route bail out of static prerendering.
  // ponytail: mount only. A `?topic=` change while already on `/` does not re-seed,
  // which is fine while every link that sends one lives on another route.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const q = params.get("q");
    if (topic) {
      setActiveTopic(topic);
      setActiveSection(topic);
    }
    if (q) setInitialPrompt(q);
  }, []);

  // Put the admin back where they were. An effect rather than a lazy `useState` initializer:
  // this route is prerendered, so the server has no `sessionStorage` and reading it during
  // render would mismatch on hydration.
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(DASHBOARD_VIEW_KEY);
      if (!saved) return;
      const { open, tab } = JSON.parse(saved) as { open?: boolean; tab?: string };
      if (open) setIsDashboardOpen(true);
      // Validated: a tab this build no longer has would draw an empty dashboard.
      if (tab && (DASHBOARD_TABS as readonly string[]).includes(tab)) {
        setDashboardTab(tab as DashboardTab);
      }
    } catch {
      // Blocked store or unreadable value: the chat is the default anyway.
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        DASHBOARD_VIEW_KEY,
        JSON.stringify({ open: isDashboardOpen, tab: dashboardTab })
      );
    } catch {
      // Private mode or a blocked store: the view just will not outlive the refresh.
    }
  }, [isDashboardOpen, dashboardTab]);

  // The gate behind every guest-facing action: signed-in visitors run the action
  // straight away, guests get the login modal and the action is replayed the moment
  // it reports success.
  //
  // Browsing is deliberately outside it. The sidebar's sections and course rows, a
  // question carried in on `/?topic=` or `/?q=`, and typing in the composer all work
  // for a guest, so the site can be read before there is an account to make. What the
  // gate covers is acting on what you read — sending, the follow-up chips, the review
  // buttons, and the checkout.
  const pendingActionRef = useRef<(() => void) | null>(null);
  const requireLogin = useCallback(
    (action: () => void) => {
      if (isLoggedIn) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setIsLoginOpen(true);
    },
    [isLoggedIn]
  );

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    clearAuthError();
    pendingActionRef.current = null;
  };

  // Kept, but deliberately unreachable: Settings used to hang off the profile chip,
  // which made a name-and-avatar row the app's only route there. The page and its
  // /settings route still exist for whenever it gets a proper entry point.
  const handleOpenSettings = () => {
    setIsDashboardOpen(false);
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    setIsSettingsOpen(true);
  };
  const handleCloseSettings = () => setIsSettingsOpen(false);
  const handleOpenDashboard = () => {
    setIsSettingsOpen(false);
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    setIsDashboardOpen(true);
  };
  const handleCloseDashboard = () => setIsDashboardOpen(false);
  const handleOpenLearning = () => {
    setIsSettingsOpen(false);
    setIsDashboardOpen(false);
    setStudentView(null);
    setActiveSection(null);
    setIsLearningOpen(true);
  };
  const handleCloseLearning = () => setIsLearningOpen(false);
  // The identity chip opens "the dashboard", which is not the same place twice: an
  // academy admin lands on the metrics dashboard, a student on the courses an admin
  // granted them. Only reachable while signed in — both chips render only for a user.
  const handleOpenProfile = () =>
    user?.isAdmin ? handleOpenDashboard() : handleOpenLearning();
  const handleLogout = () => {
    try {
      window.sessionStorage.removeItem(DASHBOARD_VIEW_KEY);
    } catch {
      // Nothing to clear if the store is unavailable.
    }
    setIsDashboardOpen(false);
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    logout();
  };

  return (
    <ToastProvider>
      <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-[#9d5932] selection:text-white transition-colors duration-150">
        {/* Animated Collapsible Sidebar */}
        <Sidebar
          isOpen={isOpen}
          onToggle={toggle}
          isMobile={isMobile}
          isLoggedIn={isLoggedIn}
          user={user}
          onLogout={handleLogout}
          onSelectSection={(topic) => {
            setIsSettingsOpen(false);
            setIsDashboardOpen(false);
            setStudentView(null);
            setIsLearningOpen(false);
            setActiveSection(topic);
            setActiveTopic(topic);
          }}
          onNewChat={() => {
            setIsSettingsOpen(false);
            setIsDashboardOpen(false);
            setStudentView(null);
            setIsLearningOpen(false);
            setActiveSection(null);
            setActiveTopic(null);
            setResetSignal((prev) => prev + 1);
          }}
          onOpenLogin={handleOpenLogin}
          onOpenProfile={handleOpenProfile}
          onOpenDashboard={() => requireLogin(handleOpenDashboard)}
          onOpenStudentView={(view) => requireLogin(() => setStudentView(view))}
          onOpenLearning={() => requireLogin(handleOpenLearning)}
          isDashboardOpen={isDashboardOpen && !!user?.isAdmin}
          activeDashboardTab={dashboardTab}
          onSelectDashboardTab={setDashboardTab}
          onBackToChat={handleCloseDashboard}
          activeItem={
            isDashboardOpen && user?.isAdmin
              ? "dashboard"
              : isLearningOpen
                ? "learning"
                : studentView
                  ? `my_${studentView}`
                  : activeSection
          }
        />

        {/* Main Canvas Area, Settings Page, or Admin Dashboard */}
        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          {isDashboardOpen && user?.isAdmin ? (
            <AdminDashboard
              activeTab={dashboardTab}
              onChangeTab={setDashboardTab}
              onBackToChat={handleCloseDashboard}
              sidebarOpen={isOpen}
              onToggleSidebar={toggle}
            />
          ) : isSettingsOpen ? (
            <SettingsPage onBack={handleCloseSettings} />
          ) : studentView ? (
            <StudentPanel
              view={studentView}
              onBack={() => setStudentView(null)}
              onBrowseCourses={() => {
                setStudentView(null);
                setActiveSection("courses");
                setActiveTopic("courses");
              }}
            />
          ) : isLearningOpen && isLoggedIn && !user?.isAdmin ? (
            <MyLearningPage
              onBack={handleCloseLearning}
              onOpenCourse={(topic) => {
                setIsLearningOpen(false);
                setActiveTopic(topic);
              }}
            />
          ) : (
            <>
              <GuestHeader
                sidebarOpen={isOpen}
                onToggleSidebar={toggle}
                onOpenLogin={handleOpenLogin}
                onLogout={handleLogout}
                onOpenProfile={handleOpenProfile}
                isMobile={isMobile}
                user={user}
              />

              <ChatCanvas
                activeTopic={activeTopic}
                onTopicHandled={() => setActiveTopic(null)}
                initialPrompt={initialPrompt}
                resetSignal={resetSignal}
                onRequireLogin={requireLogin}
              />
            </>
          )}
        </main>

        {/* Reusable Login / Signup Modal */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={handleCloseLogin}
          onSuccess={() => {
            setIsLoginOpen(false);
            // Replay whatever the guest was blocked on. Read through the ref, not the
            // gate, so it runs even though `isLoggedIn` has not re-rendered yet.
            const pending = pendingActionRef.current;
            pendingActionRef.current = null;
            pending?.();
          }}
        />
      </div>
    </ToastProvider>
  );
}
