"use client";

import { PanelLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GuestHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenLogin: () => void;
  modelName?: string;
}

export function GuestHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenLogin,
  modelName = "Jarvis AI Academy",
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
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <PanelLeft className="w-4 h-4" />
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
