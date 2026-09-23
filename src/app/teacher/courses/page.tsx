"use client";

import React from "react";
import { useTeacherShell } from "@/components/teacher/teacher-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { TeacherCoursesView } from "@/components/teacher/teacher-courses-view";

export default function TeacherCoursesRoute() {
  const { sidebarOpen, onToggleSidebar } = useTeacherShell();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminHeader
        title="My Courses"
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        <TeacherCoursesView
          sidebarOpen={sidebarOpen}
          onToggleSidebar={onToggleSidebar}
        />
      </div>
    </div>
  );
}
