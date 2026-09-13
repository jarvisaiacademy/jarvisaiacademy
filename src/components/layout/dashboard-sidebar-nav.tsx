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
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";

export type DashboardTab = "courses" | "users" | "analytics" | "cloud";

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
  const { courses, isLiveFromFirebase } = useCourses();

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
        <div className="flex items-center justify-between px-2 pb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Admin Management
          </span>
          <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveFromFirebase ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
              }`}
            />
            {isLiveFromFirebase ? "Live Cloud" : "Local Store"}
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
            <span>Courses (CRUD)</span>
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

        {/* 3. Revenue & Analytics */}
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

        {/* 4. Firebase Cloud Sync */}
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
      </div>

      {/* Informative Admin Card */}
      <div className="mt-2 p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex flex-col gap-1.5 select-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Admin Access Active</span>
        </div>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Course modifications immediately reflect across chat recommendations, live catalog cards, and student checkout.
        </p>
      </div>
    </div>
  );
}

export default DashboardSidebarNav;
