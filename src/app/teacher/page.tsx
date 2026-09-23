"use client";

import React from "react";
import { TeacherShell, type TeacherTab } from "@/components/teacher/teacher-shell";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";
import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { DashboardReferrals } from "@/components/dashboard/dashboard-referrals";
import { AdminHeader } from "@/components/admin/admin-header";

const TAB_TITLES: Record<TeacherTab, string> = {
  home: "Teacher Dashboard",
  profile: "My Profile",
  courses: "My Courses",
  referrals: "My Referral",
};

export default function TeacherRoute() {
  return (
    <TeacherShell defaultTab="home">
      {({ activeTab, onSelectTab, sidebarOpen, onToggleSidebar }) => (
        <div className="flex h-full min-h-0 flex-col">
          {activeTab !== "home" && (
            <AdminHeader
              title={TAB_TITLES[activeTab]}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={onToggleSidebar}
            />
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {(activeTab === "home" || activeTab === "courses") && (
              <TeacherDashboard
                sidebarOpen={sidebarOpen}
                onToggleSidebar={onToggleSidebar}
                activeTab={activeTab}
              />
            )}
            {activeTab === "profile" && <DashboardProfile />}
            {activeTab === "referrals" && <DashboardReferrals />}
          </div>
        </div>
      )}
    </TeacherShell>
  );
}
