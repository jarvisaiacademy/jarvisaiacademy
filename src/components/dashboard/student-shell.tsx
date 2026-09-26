"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentDashboardSidebar } from "./student-dashboard-sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";

export type StudentTab = "home" | "profile" | "courses" | "certificates" | "referrals";

const VALID_TABS: Record<StudentTab, true> = {
  home: true,
  profile: true,
  courses: true,
  certificates: true,
  referrals: true,
};

function isStudentTab(value: string | null): value is StudentTab {
  return !!value && value in VALID_TABS;
}

const TAB_STORAGE_KEY = "jarvis_student_tab";

export interface StudentShellState {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface StudentShellProps {
  defaultTab: StudentTab;
  restoreTab?: boolean;
  children: (shell: StudentShellState) => React.ReactNode;
}

/**
 * The student dashboard's frame — mirrors AdminShell in structure.
 *
 * Gate: any non-student (guest or admin) is redirected away.
 * Auth lives in localStorage so the reveal is one commit after hydration:
 * server HTML and the first client render paint nothing.
 *
 * firestore.rules is the real access control. This gate is UX only.
 */
export function StudentShell({ defaultTab, restoreTab = true, children }: StudentShellProps) {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, isTeacher: authIsTeacher } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<StudentTab>(defaultTab);

  const [isTeacher, setIsTeacher] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("jarvis_is_teacher") === "true" ||
      sessionStorage.getItem("jarvis_is_teacher") === "true"
    );
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (restoreTab && isStudentTab(stored)) setTab(stored);
    setMounted(true);
  }, [restoreTab]);

  useEffect(() => {
    if (authIsTeacher || user?.isTeacher) {
      setIsTeacher(true);
      return;
    }
    if (!user?.id) {
      setIsTeacher(false);
      return;
    }
    let active = true;
    import("@/providers/auth-provider").then(({ checkTeacherStatus }) => {
      checkTeacherStatus(user.id, user.email).then((isT) => {
        if (active) {
          setIsTeacher(isT);
        }
      });
    });
    return () => { active = false; };
  }, [user?.id, user?.email, authIsTeacher, user?.isTeacher]);

  const teacherResolved = isTeacher === true || authIsTeacher === true || user?.isTeacher === true;
  const hasTabSession =
    typeof window !== "undefined" && sessionStorage.getItem("jarvis_session_active") === "true";

  // Admins have their own dashboard; teachers go to faculty dashboard; guests need to log in first.
  // Direct pasting in a new tab without an active tab session redirects to home page.
  const isAuthorized =
    mounted &&
    hasTabSession &&
    isLoggedIn &&
    !user?.isAdmin &&
    !teacherResolved &&
    isTeacher === false;

  useEffect(() => {
    if (!mounted || isTeacher === null) return;
    if (!hasTabSession || !isLoggedIn) {
      router.replace("/");
    } else if (user?.isAdmin) {
      router.replace("/admin");
    } else if (teacherResolved) {
      router.replace("/teacher");
    }
  }, [mounted, hasTabSession, isLoggedIn, user?.isAdmin, isTeacher, teacherResolved, router]);

  const handleSelectTab = useCallback((next: StudentTab) => {
    setTab(next);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // storage unavailable
    }
  }, []);

  const goHome = useCallback(() => router.push("/"), [router]);

  if (!mounted || !isAuthorized) return null;

  return (
    <ToastProvider>
      <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-[#9d5932] selection:text-white transition-colors duration-150">
        <StudentDashboardSidebar
          isOpen={isOpen}
          onToggle={toggle}
          isMobile={isMobile}
          activeTab={tab}
          onSelectTab={handleSelectTab}
          onBackToChat={goHome}
        />

        <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
          {children({
            activeTab: tab,
            onSelectTab: handleSelectTab,
            sidebarOpen: isOpen,
            onToggleSidebar: toggle,
          })}
        </main>
      </div>
    </ToastProvider>
  );
}
