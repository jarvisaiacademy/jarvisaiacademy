"use client";

import React from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  Database,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Contact,
  Settings as SettingsIcon,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useAssignments } from "@/providers/assignments-provider";
import { useTeachers } from "@/providers/teachers-provider";
import { academyKnowledge } from "@/data/academy-knowledge";

export type DashboardTab =
  | "courses"
  | "teachers"
  | "knowledge"
  | "settings"
  | "users"
  | "assignments"
  | "analytics"
  | "cloud";

interface DashboardSidebarNavProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onBackToChat: () => void;
  isMobile?: boolean;
}

export function DashboardSidebarNav({
  activeTab,
  onSelectTab,
  onBackToChat,
  isMobile,
}: DashboardSidebarNavProps) {
  const { courses } = useCourses();
  const { assignments } = useAssignments();
  const { teachers } = useTeachers();

  const activeGrantCount = assignments.filter((a) => a.status === "active").length;

  // Cloud & Seeder is a development tool — seeding overwrites the live catalogue. Kept in
  // step with `canSeed` in admin-dashboard.tsx, which gates the same tab's content.
  const canSeed = process.env.NODE_ENV === "development";

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

      {/* Navigation Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center px-2 pb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Admin Management
          </span>
        </div>

        {/* 1. Courses (CRUD) */}
        <button
          type="button"
          onClick={() => handleSelect("courses")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "courses"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen
              className={`w-4 h-4 ${
                activeTab === "courses"
                  ? "text-blue-400 dark:text-blue-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Courses</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "courses"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {courses.length}
          </span>
        </button>

        {/* Teachers (CRUD). Sits beside Courses because the two are linked: assigning a
            teacher to a course here and picking teachers on a course are the same edge. */}
        <button
          type="button"
          onClick={() => handleSelect("teachers")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "teachers"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Contact
              className={`w-4 h-4 ${
                activeTab === "teachers"
                  ? "text-amber-400 dark:text-amber-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Teachers</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "teachers"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {teachers.length}
          </span>
        </button>

        {/* Answer Book. Last of the content tabs, because it is reference rather than
            management — nothing here can be edited. */}
        <button
          type="button"
          onClick={() => handleSelect("knowledge")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "knowledge"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen
              className={`w-4 h-4 ${
                activeTab === "knowledge"
                  ? "text-indigo-400 dark:text-indigo-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Answer Book</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "knowledge"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {Object.keys(academyKnowledge).length}
          </span>
        </button>

        {/* Academy Settings. The figures the site quotes. Not a record list like the others:
            one document of scalars, so it carries no count badge. */}
        <button
          type="button"
          onClick={() => handleSelect("settings")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <SettingsIcon
              className={`w-4 h-4 ${
                activeTab === "settings"
                  ? "text-rose-400 dark:text-rose-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Settings</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "settings"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            Config
          </span>
        </button>

        {/* 2. Users / Learners & Admissions */}
        <button
          type="button"
          onClick={() => handleSelect("users")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users
              className={`w-4 h-4 ${
                activeTab === "users"
                  ? "text-emerald-400 dark:text-emerald-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Users &amp; Admissions</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "users"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            Learners
          </span>
        </button>

        {/* 3. Course Assignments */}
        <button
          type="button"
          onClick={() => handleSelect("assignments")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "assignments"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <GraduationCap
              className={`w-4 h-4 ${
                activeTab === "assignments"
                  ? "text-indigo-400 dark:text-indigo-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Assignments</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "assignments"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {activeGrantCount}
          </span>
        </button>

        {/* 4. Revenue & Analytics */}
        <button
          type="button"
          onClick={() => handleSelect("analytics")}
          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp
              className={`w-4 h-4 ${
                activeTab === "analytics"
                  ? "text-amber-400 dark:text-amber-600"
                  : "text-neutral-500"
              }`}
            />
            <span>Revenue &amp; Analytics</span>
          </div>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "analytics"
                ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            KPIs
          </span>
        </button>

        {/* 5. Firebase Cloud Sync — development only */}
        {canSeed && (
          <button
            type="button"
            onClick={() => handleSelect("cloud")}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cloud"
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database
                className={`w-4 h-4 ${
                  activeTab === "cloud"
                    ? "text-purple-400 dark:text-purple-600"
                    : "text-neutral-500"
                }`}
              />
              <span>Cloud &amp; Seeder</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "cloud"
                  ? "bg-white/20 dark:bg-black/15 text-white dark:text-neutral-900"
                  : "bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
              }`}
            >
              Sync
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default DashboardSidebarNav;
