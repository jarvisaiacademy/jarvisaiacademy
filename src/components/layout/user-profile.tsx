"use client";

import { LogOut } from "lucide-react";
import { User } from "@/providers/auth-provider";

interface UserProfileProps {
  user?: User | null;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

export function UserProfile({
  user,
  onProfileClick,
  onLogout,
}: UserProfileProps) {
  const name = user?.name || "Jarvis Member";
  const plan = user?.plan || "Pro";
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "JA";

  return (
    <div className="flex items-center justify-between p-3 border-t border-neutral-200 dark:border-white/5 bg-transparent select-none">
      <button
        type="button"
        onClick={onProfileClick}
        className="flex items-center gap-2.5 min-w-0 p-1 -m-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
      >
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
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
            {name}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5 truncate max-w-[140px]">
            {user?.email || plan}
          </span>
        </div>
      </button>

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
