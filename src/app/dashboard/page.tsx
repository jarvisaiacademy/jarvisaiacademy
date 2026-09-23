"use client";

import React from "react";
import { StudentShell } from "@/components/dashboard/student-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { DashboardCourses } from "@/components/dashboard/dashboard-courses";
import { DashboardCertificates } from "@/components/dashboard/dashboard-certificates";
import { DashboardReferrals } from "@/components/dashboard/dashboard-referrals";
import { type StudentTab } from "@/components/dashboard/student-shell";

const TAB_TITLES: Record<StudentTab, string> = {
  home: "My Dashboard",
  profile: "My Profile",
  courses: "My Courses",
  certificates: "Certificates",
  referrals: "My Referral",
};

/**
 * /dashboard — the student's personal dashboard.
 *
 * Uses the same AdminHeader (with theme switcher + user logout) as the admin
 * dashboard, just with a student-facing title. Tab state lives in sessionStorage.
 */
export default function StudentDashboardPage() {
  return (
    <StudentShell defaultTab="home">
      {({ activeTab, onSelectTab, sidebarOpen, onToggleSidebar }) => (
        <div className="flex h-full min-h-0 flex-col">
          {/* Shared header — theme switcher + user logout, same as admin */}
          <AdminHeader
            title={TAB_TITLES[activeTab]}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={onToggleSidebar}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "home" && <DashboardHome onSelectTab={onSelectTab} />}
            {activeTab === "profile" && <DashboardProfile />}
            {activeTab === "courses" && <DashboardCourses />}
            {activeTab === "certificates" && <DashboardCertificates />}
            {activeTab === "referrals" && <DashboardReferrals />}
          </div>
        </div>
      )}
    </StudentShell>
  );
}
