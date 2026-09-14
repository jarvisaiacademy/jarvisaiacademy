"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { SettingsPage } from "@/components/settings/settings-page";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { StudentPanel, type StudentView } from "@/components/student/student-panel";
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
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const handleOpenLogin = () => setIsLoginOpen(true);
  const handleCloseLogin = () => {
    setIsLoginOpen(false);
    clearAuthError();
  };
  const handleOpenSettings = () => {
    setIsDashboardOpen(false);
    setStudentView(null);
    setIsSettingsOpen(true);
  };
  const handleCloseSettings = () => setIsSettingsOpen(false);
  const handleOpenDashboard = () => {
    setIsSettingsOpen(false);
    setStudentView(null);
    setIsDashboardOpen(true);
  };
  const handleCloseDashboard = () => setIsDashboardOpen(false);
  const handleLogout = () => {
    setIsDashboardOpen(false);
    setStudentView(null);
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
            setActiveTopic(topic);
          }}
          onNewChat={() => {
            setIsSettingsOpen(false);
            setIsDashboardOpen(false);
            setStudentView(null);
            setActiveTopic(null);
            setResetSignal((prev) => prev + 1);
          }}
          onOpenLogin={handleOpenLogin}
          onOpenSettings={handleOpenSettings}
          onOpenDashboard={handleOpenDashboard}
          onOpenStudentView={setStudentView}
        />

        {/* Main Canvas Area, Settings Page, or Admin Dashboard */}
        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          {isDashboardOpen && user?.isAdmin ? (
            <AdminDashboard onBackToChat={handleCloseDashboard} />
          ) : isSettingsOpen ? (
            <SettingsPage onBack={handleCloseSettings} />
          ) : studentView ? (
            <StudentPanel
              view={studentView}
              onBack={() => setStudentView(null)}
              onBrowseCourses={() => {
                setStudentView(null);
                setActiveTopic("courses");
              }}
            />
          ) : (
            <>
              <GuestHeader
                sidebarOpen={isOpen}
                onToggleSidebar={toggle}
                onOpenLogin={handleOpenLogin}
                isMobile={isMobile}
                user={user}
              />

              <ChatCanvas
                activeTopic={activeTopic}
                onTopicHandled={() => setActiveTopic(null)}
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
