"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { upsertStudentRecord } from "@/services/students-service";
import { publishReferralCode } from "@/services/referral-service";
import { referralCodeFor, resolvedReferralCode } from "@/data/referrals";
import { checkIsAdmin } from "@/lib/admin-access";

export { checkIsAdmin, ADMIN_EMAILS } from "@/lib/admin-access";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: "admin" | "teacher" | "student";
  isAdmin?: boolean;
  isTeacher?: boolean;
  /** Everything the Google account handed us, carried through for the candidate record. */
  emailVerified?: boolean;
  signInProvider?: string;
  createdAt?: string;
  referralCode?: string;
}

export interface GoogleLoginResult {
  /** True only when a user session was actually established. */
  ok: boolean;
  /**
   * True only for an account Google has just created, which is what the referral step hangs off.
   * It has to be the *account's* first sign-in rather than the browser's, or a learner signing in
   * on a second device would be asked for a code they already gave.
   */
  isNewUser: boolean;
  /** The signed-in account id, or "" when there is no session. Carried here so the caller does
   * not have to wait for a re-render to learn who just signed in. */
  uid: string;
  role?: "admin" | "teacher" | "student";
  isAdmin?: boolean;
  isTeacher?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  /** False until Firebase Auth has finished its first persistence restore. */
  sessionReady: boolean;
  authError: string | null;
  loginWithGoogle: () => Promise<GoogleLoginResult>;
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

async function resolveAdminStatus(uid: string, email?: string | null): Promise<boolean> {
  if (!db) return false;

  const allowlisted = email ? checkIsAdmin(email) : false;

  if (allowlisted) {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      const storedRole = (userDoc.data()?.role || "").toLowerCase().trim();
      if (!userDoc.exists() || storedRole !== "admin") {
        await setDoc(userRef, { role: "admin" }, { merge: true });
      }
    } catch (err) {
      console.warn("[Auth] Could not sync admin role to Firestore document:", err);
    }
    return true;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) return false;
    return (userDoc.data()?.role || "").toLowerCase().trim() === "admin";
  } catch {
    return false;
  }
}


// Cache auth session in localStorage and sessionStorage so that page reloads
// and multi-tab workflows maintain session state seamlessly per GEMINI.md.
function saveUserSession(mappedUser: User | null) {
  try {
    if (mappedUser) {
      const serialized = JSON.stringify(mappedUser);
      sessionStorage.setItem("jarvis_auth_user", serialized);
      localStorage.setItem("jarvis_auth_user", serialized);
      if (mappedUser.isTeacher) {
        sessionStorage.setItem("jarvis_is_teacher", "true");
        localStorage.setItem("jarvis_is_teacher", "true");
      } else {
        sessionStorage.removeItem("jarvis_is_teacher");
        localStorage.removeItem("jarvis_is_teacher");
      }
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("is-auth");
      }
    } else {
      sessionStorage.removeItem("jarvis_auth_user");
      sessionStorage.removeItem("jarvis_session_active");
      sessionStorage.removeItem("jarvis_is_teacher");
      localStorage.removeItem("jarvis_auth_user");
      localStorage.removeItem("jarvis_session_active");
      localStorage.removeItem("jarvis_is_teacher");
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
    const stored =
      localStorage.getItem("jarvis_auth_user") ||
      sessionStorage.getItem("jarvis_auth_user");
    if (stored && stored !== "null") {
      const parsed = JSON.parse(stored);
      parsed.isAdmin = parsed.role === "admin" || checkIsAdmin(parsed.email);
      parsed.isTeacher =
        !parsed.isAdmin &&
        (localStorage.getItem("jarvis_is_teacher") === "true" ||
          sessionStorage.getItem("jarvis_is_teacher") === "true");
      parsed.role = parsed.isAdmin ? "admin" : parsed.isTeacher ? "teacher" : "student";
      if (parsed.id) {
        parsed.referralCode = resolvedReferralCode(parsed.id, parsed.referralCode);
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function checkTeacherStatus(uid: string, email?: string | null): Promise<boolean> {
  if (!db || !email) return false;
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Direct user document check
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && userDoc.data().is_teacher === true) {
      sessionStorage.setItem("jarvis_is_teacher", "true");
      localStorage.setItem("jarvis_is_teacher", "true");
      return true;
    }

    // 2. Check teachers collection registry by email
    const teacherDoc = await getDoc(doc(db, "teachers", cleanEmail));
    if (teacherDoc.exists() && teacherDoc.data().is_teacher !== false) {
      sessionStorage.setItem("jarvis_is_teacher", "true");
      localStorage.setItem("jarvis_is_teacher", "true");
      try {
        await setDoc(doc(db, "users", uid), { is_teacher: true }, { merge: true });
      } catch {
        // best effort sync
      }
      return true;
    }

    // 3. Fallback: check users collection for pre-created teacher profile by email
    const q = query(collection(db, "users"), where("email", "==", cleanEmail));
    const snap = await getDocs(q);
    const foundDoc = snap.docs.find((d) => d.data().is_teacher === true);
    if (foundDoc) {
      sessionStorage.setItem("jarvis_is_teacher", "true");
      localStorage.setItem("jarvis_is_teacher", "true");
      try {
        const foundData = foundDoc.data();
        await setDoc(
          doc(db, "teachers", cleanEmail),
          {
            email: cleanEmail,
            name: foundData.name || "",
            is_teacher: true,
            teacherId: uid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        await setDoc(doc(db, "users", uid), { is_teacher: true }, { merge: true });
      } catch {
        // best effort sync
      }
      return true;
    }
  } catch (err) {
    console.warn("[Auth] Failed to check teacher status:", err);
  }

  // If already verified in session cache, keep it as fallback
  if (
    typeof window !== "undefined" &&
    (localStorage.getItem("jarvis_is_teacher") === "true" ||
      sessionStorage.getItem("jarvis_is_teacher") === "true")
  ) {
    return true;
  }

  return false;
}

function clearActiveSessionFlags() {
  try {
    sessionStorage.removeItem("jarvis_session_active");
    localStorage.removeItem("jarvis_session_active");
  } catch {
    // ignore
  }
}

function markSessionActive() {
  try {
    sessionStorage.setItem("jarvis_session_active", "true");
    localStorage.setItem("jarvis_session_active", "true");
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // SSR and the client's first render must agree (no localStorage on the server). Cached
  // session is restored in useLayoutEffect before paint to limit refresh flicker.
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cached = getInitialUser();
    if (cached) {
      setUser(cached);
      saveUserSession(cached);
    }
  }, []);

  // Sync Firebase Auth state — Firestore reads/writes require a live Auth session, not
  // only a cached jarvis_auth_user entry in storage.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setSessionReady(true);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
      } catch (err) {
        console.warn("[Auth] authStateReady error:", err);
      }

      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          setUser(null);
          saveUserSession(null);
          clearActiveSessionFlags();
          setSessionReady(true);
          return;
        }

        const isAdmin = await resolveAdminStatus(fbUser.uid, fbUser.email);
        let isTeacher = false;
        if (!isAdmin && fbUser.email) {
          isTeacher = await checkTeacherStatus(fbUser.uid, fbUser.email);
        }
        const role: "admin" | "teacher" | "student" = isAdmin
          ? "admin"
          : isTeacher
            ? "teacher"
            : "student";

        let referralCode = referralCodeFor(fbUser.uid);
        let createdAt = fbUser.metadata.creationTime ?? undefined;
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, "users", fbUser.uid));
            const stored = userDoc.data()?.referralCode;
            referralCode = resolvedReferralCode(fbUser.uid, stored);
            const storedCreated = userDoc.data()?.createdAt;
            if (storedCreated && typeof storedCreated === "string") {
              createdAt = storedCreated;
            }
          } catch {
            // ignore
          }
        }

        const mappedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "Learner",
          email: fbUser.email || "",
          picture: fbUser.photoURL || undefined,
          isAdmin,
          isTeacher,
          role,
          emailVerified: fbUser.emailVerified,
          signInProvider: fbUser.providerData[0]?.providerId,
          createdAt,
          referralCode,
        };
        setUser(mappedUser);
        saveUserSession(mappedUser);
        markSessionActive();
        setSessionReady(true);
      });
    })();

    return () => unsubscribe?.();
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
      isTeacher: user.isTeacher,
      emailVerified: user.emailVerified,
      signInProvider: user.signInProvider,
      createdAt: user.createdAt,
    });
    // The account's own code, and the index entry that lets someone who only knows the code find
    // them. Idempotent, and it belongs on this effect rather than beside the referral prompt:
    // the prompt only ever runs for a new account, and a code has to exist for every account,
    // including the ones that predate the feature and the ones that skip the prompt.
    void publishReferralCode(user.id).then((publishedCode) => {
      if (publishedCode && publishedCode !== user.referralCode) {
        setUser((prev) => {
          if (!prev) return null;
          const updated = { ...prev, referralCode: publishedCode };
          saveUserSession(updated);
          return updated;
        });
      }
    });
  }, [user?.id]);

  const loginWithGoogle = useCallback(async (): Promise<GoogleLoginResult> => {
    setAuthError(null);

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError(
        "Sign-in is unavailable because authentication is not configured. Please contact support."
      );
      return { ok: false, isNewUser: false, uid: "" };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isAdmin = await resolveAdminStatus(fbUser.uid, fbUser.email);
      let isTeacher = false;
      if (!isAdmin && fbUser.email) {
        isTeacher = await checkTeacherStatus(fbUser.uid, fbUser.email);
      }
      const role: "admin" | "teacher" | "student" = isAdmin
        ? "admin"
        : isTeacher
        ? "teacher"
        : "student";

      let referralCode = referralCodeFor(fbUser.uid);
      let createdAt = fbUser.metadata.creationTime ?? undefined;
      if (db) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          const stored = userDoc.data()?.referralCode;
          referralCode = resolvedReferralCode(fbUser.uid, stored);
          const storedCreated = userDoc.data()?.createdAt;
          if (storedCreated && typeof storedCreated === "string") {
            createdAt = storedCreated;
          }
        } catch {
          // ignore
        }
      }

      const mappedUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Learner",
        email: fbUser.email || "",
        picture: fbUser.photoURL || undefined,
        isAdmin,
        isTeacher,
        role,
        createdAt,
        referralCode,
      };
      setUser(mappedUser);
      saveUserSession(mappedUser);
      markSessionActive();
      // Null when the provider gives no such detail; treated as a returning account, since
      // asking a long-standing learner to re-enter a code is the worse of the two mistakes.
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false;
      return { ok: true, isNewUser, uid: fbUser.uid, isAdmin, isTeacher, role };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const message = describeAuthError(error);
      if (!message) {
        // Visitor dismissed the popup — not a failure worth reporting.
        return { ok: false, isNewUser: false, uid: "" };
      }
      console.error("[Auth] Google sign-in error:", error);
      setAuthError(message);
      return { ok: false, isNewUser: false, uid: "" };
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
    clearActiveSessionFlags();
  }, []);

  const isAdmin = !!user?.isAdmin;
  const isTeacher = !!user?.isTeacher;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin,
        isTeacher,
        sessionReady,
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
