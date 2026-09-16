"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { SettingsPage } from "@/components/settings/settings-page";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { StudentPanel, type StudentView } from "@/components/student/student-panel";
import { MyLearningPage } from "@/components/learning/my-learning-page";
import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";

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

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    clearAuthError();
  };
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
  const handleLogout = () => {
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
          onOpenSettings={handleOpenSettings}
          onOpenDashboard={handleOpenDashboard}
          onOpenStudentView={setStudentView}
          onOpenLearning={handleOpenLearning}
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
                onOpenProfile={handleOpenSettings}
                isMobile={isMobile}
                user={user}
              />

              <ChatCanvas
                activeTopic={activeTopic}
                onTopicHandled={() => setActiveTopic(null)}
                initialPrompt={initialPrompt}
                resetSignal={resetSignal}
              />
            </>
          )}
        </main>

        {/* Reusable Login / Signup Modal */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={handleCloseLogin}
          onSuccess={() => {
            console.log("Logged in successfully");
            setIsLoginOpen(false);
          }}
        />
      </div>
    </ToastProvider>
  );
}
