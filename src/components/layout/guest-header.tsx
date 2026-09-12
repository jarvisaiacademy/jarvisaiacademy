"use client";

import { PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { siteConfig } from "@/config/site";

import { User } from "@/providers/auth-provider";

interface GuestHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenLogin: () => void;
  modelName?: string;
  isMobile?: boolean;
  user?: User | null;
}

export function GuestHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenLogin,
  modelName = siteConfig.name,
  user,
}: GuestHeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 h-14 bg-transparent z-20 shrink-0 w-full select-none">
      {/* Left controls */}
      <div className="flex items-center gap-2 min-w-0">
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex items-center gap-2 min-w-0"
            >
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Open sidebar"
                className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-400 md:hover:text-white md:hover:bg-white/10 shadow-xs md:shadow-none shrink-0"
              >
                <span className="md:hidden flex items-center justify-center">
                  <MobileMenuIcon className="w-4 h-4" />
                </span>
                <span className="hidden md:flex items-center justify-center">
                  <PanelLeft className="w-4 h-4" />
                </span>
              </button>

              {/* Model title */}
              <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-foreground text-sm sm:text-base shrink min-w-0 select-none">
                <span className="truncate whitespace-nowrap max-w-[160px] sm:max-w-none">
                  {modelName}
                </span>
                <span className="hidden sm:inline-block text-xs font-normal text-neutral-400 dark:text-neutral-500 truncate select-none">
                  · {siteConfig.tagline}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right controls: Login and Sign up buttons (only when guest) */}
      {!user && (
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 rounded-full bg-foreground hover:opacity-90 text-background text-xs sm:text-sm font-semibold transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
          >
            Log in
          </button>

          <button
            type="button"
            onClick={onOpenLogin}
            className="hidden sm:inline-flex px-4 py-1.5 rounded-full bg-muted hover:bg-muted/80 border border-border text-foreground text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
          >
            Sign up for free
          </button>
        </div>
      )}
    </header>
  );
}

export default GuestHeader;
