"use client";

import React from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Gift,
  Home,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { academyKnowledge } from "@/data/academy-knowledge";
import { accountRoleOf, referredUsers, type AccountRole } from "@/data/students";

export type DashboardTab =
  | "home"
  | "admins"
  | "teachers"
  | "students"
  | "courses"
  | "knowledge"
  | "users"
  | "referrals"
  | "analytics";

interface DashboardSidebarNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onBackToChat: () => void;
  isMobile?: boolean;
}

/** One entry in the list. The active and inactive chrome is stated here, once. */
function NavButton({
  tab,
  label,
  icon: Icon,
  iconActive,
  badge,
  activeTab,
  onSelect,
}: {
  tab: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** The icon's own colour while the tab is open; every other icon is neutral. */
  iconActive: string;
  badge: React.ReactNode;
  activeTab: DashboardTab;
  onSelect: (tab: DashboardTab) => void;
}) {
  const active = activeTab === tab;

  return (
    <button
      type="button"
      onClick={() => onSelect(tab)}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${active ? iconActive : "text-neutral-500"}`} />
        <span>{label}</span>
      </div>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active
            ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
            : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
        }`}
      >
        {badge}
      </span>
    </button>
  );
}

export function DashboardSidebarNav({
  activeTab,
  onSelectTab,
  onBackToChat,
  isMobile,
}: DashboardSidebarNavProps) {
  // The count has to match the table it labels, so it is the stored count, not the fallback's.
  const { firestoreCourses: courses } = useCourses();
  const { students } = useStudents();

  // Counted with the same rule the roster pages list by, so the number beside a tab cannot
  // disagree with the number of rows on the page it opens.
  const accountsByRole: Record<AccountRole, number> = { student: 0, teacher: 0, admin: 0 };
  for (const student of students) accountsByRole[accountRoleOf(student)]++;

  const handleSelect = (tab: DashboardTab) => {
    onSelectTab(tab);
  };

  return (
    <div className="flex flex-col gap-5 px-3 py-2 text-neutral-800 dark:text-neutral-200">
      {/* Return to Chat Button */}
      <button
        type="button"
        onClick={onBackToChat}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer border border-neutral-300/50 dark:border-white/5 shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white" />
        <span>Return to Chat</span>
      </button>

      {/* Navigation Section. Home leads with the counts, then the three roles, because the
          question this dashboard is usually opened to answer is "who is on the site and as
          what". */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center px-2 pb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Admin Management
          </span>
        </div>

        <NavButton
          tab="home"
          label="Home"
          icon={Home}
          iconActive="text-amber-400 dark:text-amber-600"
          badge={students.length}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        <NavButton
          tab="admins"
          label="Admins"
          icon={ShieldCheck}
          iconActive="text-indigo-400 dark:text-indigo-600"
          badge={accountsByRole.admin}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        <NavButton
          tab="teachers"
          label="Teachers"
          icon={Briefcase}
          iconActive="text-sky-400 dark:text-sky-600"
          badge={accountsByRole.teacher}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        <NavButton
          tab="students"
          label="Students"
          icon={GraduationCap}
          iconActive="text-emerald-400 dark:text-emerald-600"
          badge={accountsByRole.student}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        <NavButton
          tab="courses"
          label="Courses"
          icon={BookOpen}
          iconActive="text-blue-400 dark:text-blue-600"
          badge={courses.length}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        {/* Answer Book. Reference rather than management — nothing here can be edited. */}
        <NavButton
          tab="knowledge"
          label="Answer Book"
          icon={BookOpen}
          iconActive="text-indigo-400 dark:text-indigo-600"
          badge={Object.keys(academyKnowledge).length}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        {/* Admissions: who has paid, as distinct from who has an account. */}
        <NavButton
          tab="users"
          label="Users & Admissions"
          icon={Users}
          iconActive="text-emerald-400 dark:text-emerald-600"
          badge="Ledger"
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        {/* Referrals: who came in on whose code. */}
        <NavButton
          tab="referrals"
          label="Referrals"
          icon={Gift}
          iconActive="text-purple-400 dark:text-purple-600"
          badge={referredUsers(students).length}
          activeTab={activeTab}
          onSelect={handleSelect}
        />

        <NavButton
          tab="analytics"
          label="Revenue & Analytics"
          icon={TrendingUp}
          iconActive="text-amber-400 dark:text-amber-600"
          badge="KPIs"
          activeTab={activeTab}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}

export default DashboardSidebarNav;
