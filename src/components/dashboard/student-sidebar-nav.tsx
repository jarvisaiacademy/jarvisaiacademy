"use client";

import React from "react";
import { Home, UserRound, BookOpen, Award, ArrowLeft } from "lucide-react";
import { type StudentTab } from "./student-shell";

interface NavButtonProps {
  tab: StudentTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: string;
  activeTab: StudentTab;
  onSelect: (tab: StudentTab) => void;
}

function NavButton({ tab, label, icon: Icon, iconActive, activeTab, onSelect }: NavButtonProps) {
  const active = activeTab === tab;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${active ? "text-background" : iconActive}`}
      />
      <span>{label}</span>
    </button>
  );
}

interface StudentSidebarNavProps {
  activeTab: StudentTab;
  onSelectTab: (tab: StudentTab) => void;
  onBackToChat: () => void;
  isMobile?: boolean;
}

export function StudentSidebarNav({
  activeTab,
  onSelectTab,
  onBackToChat,
}: StudentSidebarNavProps) {
  return (
    <div className="flex flex-col gap-5 px-3 py-2 text-neutral-800 dark:text-neutral-200">
      {/* Return to Chat */}
      <button
        type="button"
        onClick={onBackToChat}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer border border-neutral-300/50 dark:border-white/5 shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-neutral-500" />
        <span>Return to Chat</span>
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center px-2 pb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            My Dashboard
          </span>
        </div>

        <NavButton
          tab="home"
          label="Home"
          icon={Home}
          iconActive="text-amber-500 dark:text-amber-400"
          activeTab={activeTab}
          onSelect={onSelectTab}
        />
        <NavButton
          tab="profile"
          label="My Profile"
          icon={UserRound}
          iconActive="text-sky-500 dark:text-sky-400"
          activeTab={activeTab}
          onSelect={onSelectTab}
        />
        <NavButton
          tab="courses"
          label="My Courses"
          icon={BookOpen}
          iconActive="text-emerald-500 dark:text-emerald-400"
          activeTab={activeTab}
          onSelect={onSelectTab}
        />
        <NavButton
          tab="certificates"
          label="Certificates"
          icon={Award}
          iconActive="text-purple-500 dark:text-purple-400"
          activeTab={activeTab}
          onSelect={onSelectTab}
        />
      </div>
    </div>
  );
}

export default StudentSidebarNav;
