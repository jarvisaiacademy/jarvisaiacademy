"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherSidebar } from "./teacher-sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/providers/auth-provider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface TeacherShellContextState {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const TeacherShellContext = React.createContext<TeacherShellContextState | null>(null);

export function useTeacherShell() {
  const ctx = React.useContext(TeacherShellContext);
  if (!ctx) throw new Error("useTeacherShell must be used within TeacherShell");
  return ctx;
}

interface TeacherShellProps {
  children: React.ReactNode;
}

export function TeacherShell({ children }: TeacherShellProps) {
  const { isOpen, toggle, isMobile } = useSidebar(true);
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jarvis_is_teacher") === "true";
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (user?.isAdmin) {
      setIsTeacher(true);
      return;
    }

    const checkTeacherRole = async () => {
      if (!db) return;

      try {
        if (auth && typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }

        const currentUid = auth?.currentUser?.uid || user?.id;
        if (!currentUid) {
          if (isLoggedIn === false && !localStorage.getItem("jarvis_auth_user")) {
            setIsTeacher(false);
            localStorage.removeItem("jarvis_is_teacher");
            router.replace("/");
          }
          return;
        }

        const userDoc = await getDoc(doc(db, "users", currentUid));
        if (userDoc.exists() && userDoc.data().is_teacher === true) {
          setIsTeacher(true);
          localStorage.setItem("jarvis_is_teacher", "true");
        } else if (!user?.isAdmin) {
          setIsTeacher(false);
          localStorage.removeItem("jarvis_is_teacher");
        }
      } catch (err) {
        console.error("Failed to verify teacher role:", err);
      }
    };

    checkTeacherRole();
  }, [user, isLoggedIn, mounted, router]);

  useEffect(() => {
    if (mounted && isTeacher === false) {
      router.replace("/");
    }
  }, [mounted, isTeacher, router]);

  const goHome = useCallback(() => router.push("/"), [router]);

  if (!mounted || isTeacher === null || isTeacher === false) return null;

  return (
    <ToastProvider>
      <TeacherShellContext.Provider value={{ sidebarOpen: isOpen, onToggleSidebar: toggle }}>
        <div className="flex h-dvh w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-[#9d5932] selection:text-white transition-colors duration-150">
          <TeacherSidebar
            isOpen={isOpen}
            onToggle={toggle}
            isMobile={isMobile}
            onBackToChat={goHome}
          />

          <main className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-background relative overflow-hidden transition-colors duration-150">
            {children}
          </main>
        </div>
      </TeacherShellContext.Provider>
    </ToastProvider>
  );
}
