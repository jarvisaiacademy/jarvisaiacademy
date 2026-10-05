"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { GuestHeader } from "@/components/layout/guest-header";
import { ChatCanvas } from "@/components/chat/chat-canvas";
import { LoginModal } from "@/components/auth/login-modal";
import { SettingsPage } from "@/components/settings/settings-page";
import { StudentPanel, type StudentView } from "@/components/student/student-panel";
import { MyLearningPage } from "@/components/learning/my-learning-page";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";
import { topicToUrl, urlToTopic } from "@/lib/chat-routes";

export interface ChatPageViewProps {
  initialTopic?: string | null;
  initialPrompt?: string | null;
}

export function ChatPageView({
  initialTopic,
  initialPrompt: initialPromptProp,
}: ChatPageViewProps = {}) {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout, clearAuthError, isTeacher } = useAuth();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [studentView, setStudentView] = useState<StudentView | null>(null);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(initialTopic ?? null);
  const [activeSection, setActiveSection] = useState<string | null>(initialTopic ?? null);
  const [resetSignal, setResetSignal] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(initialPromptProp ?? null);

  // Sync initial topic and query params on mount or route change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const pathTopic = urlToTopic(pathname);
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const q = params.get("q");
    const login = params.get("login");

    const effectiveTopic = initialTopic || pathTopic || topic;
    if (effectiveTopic) {
      setActiveTopic(effectiveTopic);
      setActiveSection(effectiveTopic);
    }
    if (q) setInitialPrompt(q);
    if (login === "true") setIsLoginOpen(true);
  }, [initialTopic]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const topic = urlToTopic(window.location.pathname);
      if (topic) {
        setIsSettingsOpen(false);
        setStudentView(null);
        setIsLearningOpen(false);
        setActiveSection(topic);
        setActiveTopic(topic);
      } else if (window.location.pathname === "/") {
        setIsSettingsOpen(false);
        setStudentView(null);
        setIsLearningOpen(false);
        setActiveSection(null);
        setActiveTopic(null);
        setResetSignal((prev) => prev + 1);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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

  const handleOpenSettings = () => {
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    setIsSettingsOpen(true);
  };
  const handleCloseSettings = () => setIsSettingsOpen(false);
  const handleOpenLearning = () => {
    setIsSettingsOpen(false);
    setStudentView(null);
    setActiveSection(null);
    setIsLearningOpen(true);
  };
  const handleCloseLearning = () => setIsLearningOpen(false);

  const handleOpenProfile = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("jarvis_session_active", "true");
    }
    if (user?.isAdmin) {
      router.push("/admin");
    } else if (
      user?.isTeacher ||
      isTeacher ||
      (typeof window !== "undefined" && localStorage.getItem("jarvis_is_teacher") === "true")
    ) {
      router.push("/teacher");
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = () => {
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    logout();
  };

  const handleSelectSection = useCallback((topic: string) => {
    setIsSettingsOpen(false);
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(topic);
    setActiveTopic(topic);

    const targetUrl = topicToUrl(topic);
    if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
      window.history.pushState(null, "", targetUrl);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setIsSettingsOpen(false);
    setStudentView(null);
    setIsLearningOpen(false);
    setActiveSection(null);
    setActiveTopic(null);
    setResetSignal((prev) => prev + 1);

    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  }, []);

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
          onSelectSection={handleSelectSection}
          onNewChat={handleNewChat}
          onOpenLogin={handleOpenLogin}
          onOpenProfile={handleOpenProfile}
          onOpenDashboard={() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("jarvis_session_active", "true");
            }
            router.push("/admin");
          }}
          onOpenStudentView={(view) => requireLogin(() => setStudentView(view))}
          onOpenLearning={() => requireLogin(handleOpenLearning)}
          activeItem={
            isLearningOpen
              ? "learning"
              : studentView
                ? `my_${studentView}`
                : activeSection
          }
        />

        {/* Main Canvas Area, Settings Page, Student Panel or My Learning */}
        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          {isSettingsOpen ? (
            <SettingsPage onBack={handleCloseSettings} />
          ) : studentView ? (
            <StudentPanel
              view={studentView}
              onBack={() => setStudentView(null)}
              onBrowseCourses={() => {
                setStudentView(null);
                handleSelectSection("courses");
              }}
            />
          ) : isLearningOpen && isLoggedIn && !user?.isAdmin ? (
            <MyLearningPage onBack={handleCloseLearning} />
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
          onSuccess={(loginResult) => {
            setIsLoginOpen(false);
            const pending = pendingActionRef.current;
            pendingActionRef.current = null;
            if (pending) {
              pending();
            } else {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("jarvis_session_active", "true");
              }
              const isAdminUser = loginResult?.isAdmin ?? user?.isAdmin;
              const isTeacherUser =
                loginResult?.isTeacher ??
                user?.isTeacher ??
                isTeacher ??
                (typeof window !== "undefined" && localStorage.getItem("jarvis_is_teacher") === "true");

              if (isAdminUser) {
                router.push("/admin");
              } else if (isTeacherUser) {
                router.push("/teacher");
              } else {
                router.push("/dashboard");
              }
            }
          }}
        />
      </div>
    </ToastProvider>
  );
}

export default ChatPageView;
