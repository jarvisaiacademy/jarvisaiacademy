"use client";

import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/providers/theme-provider";

interface ThemeSwitcherProps {
  className?: string;
}

/**
 * One button, one icon: the icon reports the appearance you are in, and a click
 * flips to the other one.
 *
 * Which icon shows is decided by the `.dark` class on <html> via Tailwind, not by
 * React state, so it is already right on the first paint instead of correcting after
 * mount — and both icons are always in the DOM, so hydration cannot mismatch. Only
 * the click handler reads `resolvedTheme`, and by then the component is mounted.
 */
export function ThemeSwitcher({ className = "" }: ThemeSwitcherProps) {
  const { setTheme, resolvedTheme, systemTheme } = useTheme();

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9, rotate: -18 }}
      // Picking whichever theme the OS already is keeps "system" stored, so the app
      // goes on following the OS instead of pinning an explicit one. The settings
      // sheet applies the same rule.
      onClick={() => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next === systemTheme ? "system" : next);
      }}
      title="Toggle light and dark appearance"
      aria-label="Toggle light and dark appearance"
      className={`flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200/60 dark:bg-[#1c1c1c] border border-neutral-300/50 dark:border-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300/60 dark:hover:bg-[#2d2d2d] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer select-none ${className}`}
    >
      <Sun className="w-4 h-4 dark:hidden" />
      <Moon className="hidden w-4 h-4 dark:block" />
    </motion.button>
  );
}

export default ThemeSwitcher;
