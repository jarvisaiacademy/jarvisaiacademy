"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { upsertStudentRecord } from "@/services/students-service";

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
  authError: string | null;
  /** Resolves true only when a user session was actually established. */
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Turn Firebase error codes into something a visitor can act on.
 * Returns "" for deliberate cancellations, which are not errors.
 */
function describeAuthError(error: { code?: string; message?: string }): string {
  // Firebase can pack the raw message into `code` (e.g. "auth/permission-denied: consumer
  // 'api-key:...' has been suspended."), so match on the leading identifier only.
  const code = error.code?.split(":")[0] ?? "";

  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in window. Allow popups for this site, then try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorised for sign-in. Add it under Authentication → Settings → Authorized domains in the Firebase console.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this project.";
    case "auth/network-request-failed":
      return "Could not reach the sign-in service. Check your connection and try again.";
    case "auth/permission-denied":
      return "Sign-in is temporarily unavailable for this site. Please try again later or contact support.";
    case "auth/internal-error":
      return "The sign-in service returned an error (internal-error). This usually means the Firebase project or its API key is disabled or suspended.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait a moment and try again.";
    default:
      return `Sign-in failed${code ? ` (${code})` : ""}. Please try again.`;
  }
}

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  "sugatraj.2106@gmail.com,hivirajkadam@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// The session lives in localStorage only. It was mirrored into a `jarvis_auth_user` cookie
// that nothing read — no middleware, no server component, no route handler — so it put a
// name and email address in every visitor's cookie jar for no reason. Do not add it back
// without a server-side reader.
function saveUserSession(mappedUser: User | null) {
  try {
    if (mappedUser) {
      localStorage.setItem("jarvis_auth_user", JSON.stringify(mappedUser));
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("is-auth");
      }
    } else {
      localStorage.removeItem("jarvis_auth_user");
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("is-auth");
      }
    }
  } catch {
    // ignore
  }
}

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("jarvis_auth_user");
    if (stored && stored !== "null") {
      const parsed = JSON.parse(stored);
      parsed.isAdmin = checkIsAdmin(parsed.email);
      parsed.role = parsed.isAdmin ? "admin" : "student";
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronous immediate initialization from localStorage prevents refresh flicker
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync Firebase Auth state in the background
  useEffect(() => {
    // Ensure state is hydrated immediately on client mount
    const cached = getInitialUser();
    if (cached && !user) {
      setUser(cached);
    }

    if (isFirebaseConfigured && auth) {
      // Listen for authenticated user updates without wiping local session on initial tick
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
          saveUserSession(mappedUser);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Best-effort roster sync so admins can assign courses to real accounts.
  useEffect(() => {
    if (!user) return;
    void upsertStudentRecord({
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      plan: user.plan,
    });
  }, [user]);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthError(null);

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError(
        "Sign-in is unavailable because authentication is not configured. Please contact support."
      );
      return false;
    }

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
      saveUserSession(mappedUser);
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const message = describeAuthError(error);
      if (!message) {
        // Visitor dismissed the popup — not a failure worth reporting.
        return false;
      }
      console.error("[Auth] Google sign-in error:", error);
      setAuthError(message);
      return false;
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const logout = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn("[Auth] Logout error:", err);
      }
    }
    setUser(null);
    saveUserSession(null);
  }, []);

  const isAdmin = !!user?.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        authError,
        loginWithGoogle,
        logout,
        clearAuthError,
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
