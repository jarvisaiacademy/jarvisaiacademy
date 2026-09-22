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

export default function Home() {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout, clearAuthError } = useAuth();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [studentView, setStudentView] = useState<StudentView | null>(null);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
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
  // The identity chip opens "the dashboard", which is not the same place twice: an
  // academy admin lands on the admin route, a student on the courses an admin
  // granted them. Only reachable while signed in — both chips render only for a user.
  const handleOpenProfile = () =>
    user?.isAdmin ? router.push("/admin") : router.push("/dashboard");
  const handleLogout = () => {
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
            setStudentView(null);
            setIsLearningOpen(false);
            setActiveSection(topic);
            setActiveTopic(topic);
          }}
          onNewChat={() => {
            setIsSettingsOpen(false);
            setStudentView(null);
            setIsLearningOpen(false);
            setActiveSection(null);
            setActiveTopic(null);
            setResetSignal((prev) => prev + 1);
          }}
          onOpenLogin={handleOpenLogin}
          onOpenProfile={handleOpenProfile}
          // The admin Dashboard item renders only for an admin, so it goes
          // straight there rather than through the login gate.
          onOpenDashboard={() => router.push("/admin")}
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
                setActiveSection("courses");
                setActiveTopic("courses");
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
