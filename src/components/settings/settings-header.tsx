"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "@/components/layout/user-profile";
import { useAuth } from "@/providers/auth-provider";

interface SettingsHeaderProps {
  onBack?: () => void;
  title?: string;
}

export function SettingsHeader({
  onBack,
  title = "Settings",
}: SettingsHeaderProps) {
  // Read the identity here rather than threading it through SettingsPage, the
  // student panel and My Learning — all three render this same header, so this is
  // the one place that gets them all. The chip is static: these surfaces *are*
  // where the identity leads, so there is nowhere for it to navigate.
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 w-full h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Jarvis AI Academy"
          title="Back to Jarvis AI Academy"
          className="p-2 -ml-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-foreground select-none truncate">
          {title}
        </h1>
      </div>

      {user && <UserProfile user={user} onLogout={logout} variant="compact" />}
    </header>
  );
}
