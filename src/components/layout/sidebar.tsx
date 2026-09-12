"use client";

import { motion } from "motion/react";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNav } from "./sidebar-nav";
import { SidebarPinned } from "./sidebar-pinned";
import { SidebarProjects } from "./sidebar-projects";
import { UserProfile } from "./user-profile";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
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
          animate={{
            x: isOpen ? 0 : -280,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="fixed top-0 left-0 bottom-0 w-[260px] bg-[#171717] border-r border-white/5 z-50 flex flex-col justify-between overflow-hidden select-none"
        >
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <SidebarHeader onToggle={onToggle} />
            <SidebarNav />
            <div className="h-px bg-white/5 mx-2 my-1" />
            <SidebarPinned />
            <div className="h-px bg-white/5 mx-2 my-1" />
            <SidebarProjects />
          </div>
          <UserProfile />
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
      <div className="w-[260px] flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <SidebarHeader onToggle={onToggle} />
        <SidebarNav />
        <div className="h-px bg-white/5 mx-2 my-1" />
        <SidebarPinned />
        <div className="h-px bg-white/5 mx-2 my-1" />
        <SidebarProjects />
      </div>
      <div className="w-[260px]">
        <UserProfile />
      </div>

    </motion.aside>
  );
}
