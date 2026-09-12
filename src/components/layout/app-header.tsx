"use client";

import { PanelLeft, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";

interface AppHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeMode: "chat" | "work";
  onModeChange: (mode: "chat" | "work") => void;
}

export function AppHeader({
  sidebarOpen,
  onToggleSidebar,
  activeMode,
  onModeChange,
}: AppHeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-4 py-3.5 h-14 bg-transparent z-20">
      {/* Left controls */}
      <div className="flex items-center gap-2">
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Open sidebar"
                title="Open sidebar (Cmd+B)"
                className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-400 md:hover:text-white md:hover:bg-white/10 shadow-xs md:shadow-none"
              >
                <span className="md:hidden flex items-center justify-center">
                  <MobileMenuIcon className="w-4 h-4" />
                </span>
                <span className="hidden md:flex items-center justify-center">
                  <PanelLeft className="w-4 h-4" />
                </span>
              </button>
              <span className="font-semibold text-sm tracking-tight text-white select-none hidden sm:inline">
                Jarvis AI Academy
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Pill: Chat | ✦ Work */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 bg-[#1f1f1f] border border-white/10 rounded-full shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange("chat")}
          className={`relative px-4 py-1 text-xs font-medium rounded-full transition-colors ${
            activeMode === "chat"
              ? "text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {activeMode === "chat" && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-[#2f2f2f] rounded-full"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">Chat</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("work")}
          className={`relative flex items-center gap-1.5 px-4 py-1 text-xs font-medium rounded-full transition-colors ${
            activeMode === "work"
              ? "text-white"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {activeMode === "work" && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-[#2f2f2f] rounded-full"
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400 fill-sky-400" />
            Work
          </span>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Refresh / Reset chat"
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
