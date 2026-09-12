"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_GOOGLE_USER: User = {
  id: "usr_google_jarvis",
  name: "Sugatraj Sarwade",
  email: "sugat@jarvisaiacademy.com",
  plan: "Pro",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user session from URL or localStorage on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const authUserParam = urlParams.get("auth_user");
      if (authUserParam) {
        const parsed = JSON.parse(decodeURIComponent(authUserParam));
        setUser(parsed);
        localStorage.setItem("jarvis_auth_user", JSON.stringify(parsed));
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      const stored = localStorage.getItem("jarvis_auth_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (clientId) {
      // Redirect to Google OAuth endpoint
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const scope = encodeURIComponent("openid email profile");
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      window.location.href = url;
    } else {
      // Instant seamless login when credentials are pending in Netlify
      setUser(DEMO_GOOGLE_USER);
      try {
        localStorage.setItem("jarvis_auth_user", JSON.stringify(DEMO_GOOGLE_USER));
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem("jarvis_auth_user");
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
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
