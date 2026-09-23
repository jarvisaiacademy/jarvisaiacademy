"use client";

import React from "react";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";
import { useTeacherShell } from "@/components/teacher/teacher-shell";

export default function TeacherRoute() {
  const { sidebarOpen, onToggleSidebar } = useTeacherShell();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <TeacherDashboard
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />
      </div>
    </div>
  );
}
