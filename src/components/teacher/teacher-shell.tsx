"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherSidebar } from "./teacher-sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type TeacherTab = "home" | "profile" | "courses" | "referrals";

const VALID_TABS: Record<TeacherTab, true> = {
  home: true,
  profile: true,
  courses: true,
  referrals: true,
};

function isTeacherTab(value: string | null): value is TeacherTab {
  return !!value && value in VALID_TABS;
}

const TAB_STORAGE_KEY = "jarvis_teacher_tab";

export interface TeacherShellState {
  activeTab: TeacherTab;
  onSelectTab: (tab: TeacherTab) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

interface TeacherShellProps {
  defaultTab: TeacherTab;
  restoreTab?: boolean;
  children: (shell: TeacherShellState) => React.ReactNode;
}

export function TeacherShell({ defaultTab, restoreTab = true, children }: TeacherShellProps) {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TeacherTab>(defaultTab);

  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (restoreTab && isTeacherTab(stored)) setTab(stored);
    setMounted(true);
  }, [restoreTab]);

  useEffect(() => {
    if (!mounted) return;
    
    if (!user) {
      if (isLoggedIn === false) {
        // Not logged in
        router.replace("/");
      }
      return;
    }

    const checkTeacherRole = async () => {
      if (!db) {
        setIsTeacher(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.id));
        if (userDoc.exists() && userDoc.data().is_teacher === true) {
          setIsTeacher(true);
        } else {
          setIsTeacher(false);
        }
      } catch (err) {
        console.error("Failed to fetch user record:", err);
        setIsTeacher(false);
      }
    };

    checkTeacherRole();
  }, [user, isLoggedIn, mounted, router]);

  useEffect(() => {
    if (isTeacher === false) {
      router.replace("/");
    }
  }, [isTeacher, router]);

  const handleSelectTab = useCallback((next: TeacherTab) => {
    setTab(next);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const goHome = useCallback(() => router.push("/"), [router]);

  if (!mounted || isTeacher === null || isTeacher === false) return null;

  return (
    <ToastProvider>
      <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-[#9d5932] selection:text-white transition-colors duration-150">
        <TeacherSidebar
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
