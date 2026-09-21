"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/providers/auth-provider";

interface UserProfileProps {
  user?: User | null;
  /**
   * Opens the dashboard for this user's role — academy admin, or student.
   * Omit it on a surface that *is* the dashboard: the chip then renders as plain
   * identity rather than a button that would go nowhere.
   */
  onProfileClick?: () => void;
  onLogout?: () => void;
  /** "sidebar" is the footer row; "compact" is the inline header chip. */
  variant?: "sidebar" | "compact";
}

export function UserProfile({
  user,
  onProfileClick,
  onLogout,
  variant = "sidebar",
}: UserProfileProps) {
  const name = user?.name || "Jarvis Member";
  const plan = user?.plan || "Pro";
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "JA";
  const compact = variant === "compact";

  const identity = (
    <>
      {user?.picture ? (
        <img
          src={user.picture}
          alt={name}
          className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
        />
      ) : (
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700 text-neutral-200 text-xs font-semibold shrink-0">
          {initials}
        </div>
      )}
      <div className={cn("flex-col min-w-0", compact ? "hidden md:flex" : "flex")}>
        <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
          {name}
        </span>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5 truncate max-w-[140px]">
          {user?.email || plan}
        </span>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex items-center select-none",
        compact
          ? "gap-1.5 shrink-0"
          : "justify-between p-3 border-t border-neutral-200 dark:border-white/5 bg-transparent"
      )}
    >
      {/* The chip's accessible name is its content, so the action is spelled out in
          the tooltip rather than overridden with an aria-label that would drop the
          email a screen reader currently reads. */}
      {onProfileClick ? (
        <button
          type="button"
          onClick={onProfileClick}
          title="Open dashboard"
          className={cn(
            "flex items-center gap-2.5 min-w-0 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer",
            compact ? "p-1" : "p-1 -m-1"
          )}
        >
          {identity}
        </button>
      ) : (
        <div className={cn("flex items-center gap-2.5 min-w-0", compact ? "p-1" : "p-1 -m-1")}>
          {identity}
        </div>
      )}

      {onLogout && (
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default UserProfile;
