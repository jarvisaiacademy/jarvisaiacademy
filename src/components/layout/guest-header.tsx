"use client";

import { PanelLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";

interface GuestHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenLogin: () => void;
  modelName?: string;
  isMobile?: boolean;
}

export function GuestHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenLogin,
  modelName = "Jarvis AI Academy",
  isMobile,
}: GuestHeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-4 py-3 h-14 bg-transparent z-20">
      {/* Left controls */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.button
              type="button"
              onClick={onToggleSidebar}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              aria-label="Open sidebar"
              className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-400 md:hover:text-white md:hover:bg-white/10 shadow-xs md:shadow-none"
            >
              <span className="md:hidden flex items-center justify-center">
                <MobileMenuIcon className="w-4 h-4" />
              </span>
              <span className="hidden md:flex items-center justify-center">
                <PanelLeft className="w-4 h-4" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Model dropdown pill */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-foreground/90 hover:text-foreground hover:bg-muted font-semibold text-base transition-colors"
        >
          <span>{modelName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Right controls: Login and Sign up buttons */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenLogin}
          className="px-4 py-1.5 rounded-full bg-foreground hover:opacity-90 text-background text-xs sm:text-sm font-semibold transition-colors shadow-sm"
        >
          Log in
        </button>

        <button
          type="button"
          onClick={onOpenLogin}
          className="px-4 py-1.5 rounded-full bg-muted hover:bg-muted/80 border border-border text-foreground text-xs sm:text-sm font-medium transition-colors"
        >
          Sign up for free
        </button>
      </div>
    </header>
  );
}
