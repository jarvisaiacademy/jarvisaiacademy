"use client";

import React from "react";
import { useTeacherShell } from "@/components/teacher/teacher-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { DashboardReferrals } from "@/components/dashboard/dashboard-referrals";

export default function TeacherReferralsRoute() {
  const { sidebarOpen, onToggleSidebar } = useTeacherShell();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminHeader
        title="My Referral"
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        <DashboardReferrals />
      </div>
    </div>
  );
}
