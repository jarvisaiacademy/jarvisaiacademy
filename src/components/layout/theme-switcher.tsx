"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ];

  return (
    <div className={`px-3 pt-2 pb-1 ${className}`}>
      <div className="flex items-center justify-between p-1 bg-neutral-200/70 dark:bg-[#202020] rounded-full border border-neutral-300/60 dark:border-white/10 shadow-2xs">
        {options.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              title={`Switch to ${label} appearance`}
              aria-label={`Switch to ${label} appearance`}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-full transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? value === "light"
                      ? "text-amber-500"
                      : value === "dark"
                      ? "text-sky-400"
                      : "text-emerald-500"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ThemeSwitcher;
