"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  plan?: string;
  role?: "admin" | "student" | "guest";
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "sugat@jarvisaiacademy.com,jarvisaiacademy@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

const DEMO_ADMIN_USER: User = {
  id: "usr_admin_sugat",
  name: "Sugatraj Sarwade",
  email: "sugat@jarvisaiacademy.com",
  plan: "Admin / Founder",
  role: "admin",
  isAdmin: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Sync Firebase Auth state if configured
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const isAdmin = checkIsAdmin(fbUser.email);
          const mappedUser: User = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Learner",
            email: fbUser.email || "",
            picture: fbUser.photoURL || undefined,
            isAdmin,
            role: isAdmin ? "admin" : "student",
            plan: isAdmin ? "Admin / Founder" : "Learner Pro",
          };
          setUser(mappedUser);
          try {
            localStorage.setItem("jarvis_auth_user", JSON.stringify(mappedUser));
          } catch {
            // ignore
          }
        } else {
          setUser(null);
          try {
            localStorage.removeItem("jarvis_auth_user");
          } catch {
            // ignore
          }
        }
      });
      return () => unsubscribe();
    } else {
      // Local fallback if Firebase keys are pending
      try {
        const stored = localStorage.getItem("jarvis_auth_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.isAdmin = checkIsAdmin(parsed.email);
          parsed.role = parsed.isAdmin ? "admin" : "student";
          setUser(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const isAdmin = checkIsAdmin(fbUser.email);
        const mappedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "Learner",
          email: fbUser.email || "",
          picture: fbUser.photoURL || undefined,
          isAdmin,
          role: isAdmin ? "admin" : "student",
          plan: isAdmin ? "Admin / Founder" : "Learner Pro",
        };
        setUser(mappedUser);
        try {
          localStorage.setItem("jarvis_auth_user", JSON.stringify(mappedUser));
        } catch {
          // ignore
        }
      } catch (err: unknown) {
        const error = err as { code?: string; message?: string };
        if (error.code !== "auth/popup-closed-by-user") {
          console.error("[Auth] Google sign-in error:", error);
        }
      }
    } else {
      // Instant fallback when Firebase keys are being configured
      setUser(DEMO_ADMIN_USER);
      try {
        localStorage.setItem("jarvis_auth_user", JSON.stringify(DEMO_ADMIN_USER));
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("[Auth] Logout error:", err);
      }
    }
    setUser(null);
    try {
      localStorage.removeItem("jarvis_auth_user");
    } catch {
      // ignore
    }
  }, []);

  const isAdmin = !!user?.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
