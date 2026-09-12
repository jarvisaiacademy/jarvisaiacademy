"use client";

import {
  SquarePen,
  Search,
  ImageIcon,
  Compass,
  Sparkles,
  ExternalLink,
  Settings,
  HelpCircle,
  PanelLeft,
  PlusCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface GuestSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenLogin: () => void;
  onNewChat?: () => void;
  isMobile?: boolean;
}

export function GuestSidebar({
  isOpen,
  onToggle,
  onOpenLogin,
  onNewChat,
  isMobile,
}: GuestSidebarProps) {
  const content = (
    <div className="w-[260px] flex flex-col justify-between h-full bg-[#171717] select-none text-neutral-300">
      {/* Top Header & Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
        {/* Header with OpenAI logo & panel toggle */}
        <div className="flex items-center justify-between px-3 py-3.5">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 fill-white"
              viewBox="0 0 24 24"
              aria-label="OpenAI logo"
            >
              <path d="M22.28 9.5a5.52 5.52 0 0 0-.46-4.39 5.67 5.67 0 0 0-4.66-2.7 5.6 5.6 0 0 0-2.31.5A5.6 5.6 0 0 0 5.48 4.6 5.62 5.62 0 0 0 2.2 8.44a5.53 5.53 0 0 0 .54 4.54 5.52 5.52 0 0 0 .46 4.39 5.67 5.67 0 0 0 4.66 2.7 5.6 5.6 0 0 0 2.31-.5 5.6 5.6 0 0 0 9.37-1.69 5.62 5.62 0 0 0 3.28-3.84 5.53 5.53 0 0 0-.54-4.54zm-8.86 11.2a3.86 3.86 0 0 1-2.09-.61l.14-.08 3.83-2.21a.88.88 0 0 0 .44-.76v-5.41l1.62.94a.1.1 0 0 1 .05.08v4.44a3.88 3.88 0 0 1-3.99 3.65zm-8.31-4.08a3.81 3.81 0 0 1-.53-2.11 3.87 3.87 0 0 1 1.55-3.08l.14.08 3.83 2.21a.87.87 0 0 0 .88 0l4.69-2.71v1.87a.1.1 0 0 1-.04.09l-3.85 2.22a3.88 3.88 0 0 1-5.45-1.57zm-.83-8.8a3.85 3.85 0 0 1 1.56-1.5 3.88 3.88 0 0 1 3.46.2l-.14.09-3.83 2.21a.89.89 0 0 0-.44.76v5.42l-1.62-.94a.1.1 0 0 1-.05-.08V7.82zm12.35 4.35-4.69-2.7v-1.87a.1.1 0 0 1 .04-.09l3.85-2.22a3.88 3.88 0 0 1 5.45 1.57 3.81 3.81 0 0 1 .53 2.11 3.87 3.87 0 0 1-1.55 3.08l-.14-.08-3.83-2.21a.89.89 0 0 0-.88 0l.22.41zm2.39-1.99a3.88 3.88 0 0 1-3.46-.2l.14-.09 3.83-2.21a.89.89 0 0 0 .44-.76V4.96l1.62.94a.1.1 0 0 1 .05.08v4.44a3.86 3.86 0 0 1-1.56 1.5l-1.06-.64zm-8.47 2.45-1.62-.94v-3.74l1.62.94v3.74z" />
            </svg>
          </div>

          <button
            type="button"
            onClick={onToggle}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Nav */}
        <nav className="flex flex-col gap-1 px-2 py-1">
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <SquarePen className="w-4 h-4 text-neutral-400" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span>Search chats</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-neutral-400" />
            <span>Images</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <Compass className="w-4 h-4 text-neutral-400" />
            <span>Plugins</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <Sparkles className="w-4 h-4 text-neutral-400" />
            <span>Deep research</span>
          </button>
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="flex flex-col gap-1 p-2 border-t border-white/5">
        <button
          type="button"
          onClick={onOpenLogin}
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4 text-neutral-400" />
            <span>See plans and pricing</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <span>Help</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        </button>

        {/* Login Promotion Card */}
        <div className="p-3 mt-1 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2">
          <span className="font-semibold text-xs text-white">
            Get responses tailored to you
          </span>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Log in to get answers based on saved chats, plus create images and upload files.
          </p>
          <button
            type="button"
            onClick={onOpenLogin}
            className="w-full py-2 rounded-full bg-[#212121] hover:bg-[#2c2c2c] border border-white/10 text-white font-medium text-xs transition-colors text-center mt-1"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            aria-hidden="true"
          />
        )}
        <motion.aside
          initial={false}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#171717] border-r border-white/5 z-50 overflow-hidden"
        >
          {content}
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 260 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className={`relative flex flex-col justify-between h-screen bg-[#171717] overflow-hidden shrink-0 select-none z-30 ${
        isOpen ? "border-r border-white/5" : "border-none"
      }`}
    >
      {content}
    </motion.aside>
  );
}
