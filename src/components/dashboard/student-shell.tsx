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
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<StudentTab>(defaultTab);

  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (restoreTab && isStudentTab(stored)) setTab(stored);
    setMounted(true);
  }, [restoreTab]);

  useEffect(() => {
    if (!user?.id) {
      setIsTeacher(false);
      return;
    }
    let active = true;
    import("firebase/firestore").then(({ doc, getDoc }) => {
      import("@/lib/firebase").then(({ db }) => {
        if (!db) return;
        getDoc(doc(db, "users", user.id)).then((snapshot) => {
          if (active && snapshot.exists()) {
            setIsTeacher(snapshot.data().is_teacher === true);
          }
        });
      });
    });
    return () => { active = false; };
  }, [user?.id]);

  // Admins have their own dashboard; guests need to log in first.
  const isAuthorized = mounted && isLoggedIn && !user?.isAdmin && isTeacher === false;

  useEffect(() => {
    if (!mounted || isTeacher === null) return;
    if (!isLoggedIn) router.replace("/");
    else if (user?.isAdmin) router.replace("/admin");
    else if (isTeacher) router.replace("/teacher");
  }, [mounted, isLoggedIn, user?.isAdmin, isTeacher, router]);

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
