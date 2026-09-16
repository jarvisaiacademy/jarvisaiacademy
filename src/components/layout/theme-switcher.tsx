"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = "px-3 pt-2 pb-1" }: ThemeSwitcherProps) {
  const { setTheme, systemTheme } = useTheme();

  // Which segment is lit is decided by the `.dark` class on <html>, not by React
  // state, so it is already right on the first paint instead of correcting after
  // mount. Idle styling is the mirror image of active styling.
  const options: {
    value: Theme;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    classes: string;
  }[] = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      classes:
        "not-dark:bg-white not-dark:text-neutral-900 not-dark:shadow-xs not-dark:font-medium dark:text-neutral-500 dark:hover:text-neutral-300 dark:hover:bg-white/5",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      classes:
        "dark:bg-[#2d2d2d] dark:text-white dark:shadow-xs dark:font-medium not-dark:text-neutral-400 not-dark:hover:text-neutral-700 not-dark:hover:bg-black/5",
    },
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between p-0.5 bg-neutral-200/60 dark:bg-[#1c1c1c] rounded-full border border-neutral-300/50 dark:border-white/5 shadow-2xs">
        {options.map(({ value, label, icon: Icon, classes }) => (
          <button
            key={value}
            type="button"
            // Toggling back to whatever the OS already is keeps "system" stored,
            // so the app resumes following the OS instead of pinning a theme.
            onClick={() => setTheme(value === systemTheme ? "system" : value)}
            title={`Switch to ${label} appearance`}
            aria-label={`Switch to ${label} appearance`}
            className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-full transition-all cursor-pointer select-none active:scale-95 ${classes}`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSwitcher;
