"use client";

import React from "react";
import { StudentShell } from "@/components/dashboard/student-shell";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { DashboardCourses } from "@/components/dashboard/dashboard-courses";
import { DashboardCertificates } from "@/components/dashboard/dashboard-certificates";

/**
 * /dashboard — the student's personal dashboard.
 *
 * All four tabs (Home, Profile, Courses, Certificates) live here.
 * The gate and sidebar chrome live in StudentShell. Tab state is kept in
 * sessionStorage so it survives a refresh without a URL segment.
 */
export default function StudentDashboardPage() {
  return (
    <StudentShell defaultTab="home">
      {({ activeTab, onSelectTab, sidebarOpen, onToggleSidebar }) => (
        <div className="flex h-full min-h-0 flex-col">
          {/* Mobile top bar */}
          <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open navigation"
              className="p-2 -ml-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-foreground capitalize">
              {activeTab === "home"
                ? "Dashboard"
                : activeTab === "profile"
                ? "My Profile"
                : activeTab === "courses"
                ? "My Courses"
                : "Certificates"}
            </h1>
            <div className="w-9" aria-hidden="true" />
          </header>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "home" && <DashboardHome onSelectTab={onSelectTab} />}
            {activeTab === "profile" && <DashboardProfile />}
            {activeTab === "courses" && <DashboardCourses />}
            {activeTab === "certificates" && <DashboardCertificates />}
          </div>
        </div>
      )}
    </StudentShell>
  );
}
