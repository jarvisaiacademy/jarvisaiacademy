"use client";

import { TeacherShell } from "@/components/teacher/teacher-shell";
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard";

export default function TeacherRoute() {
  return (
    <TeacherShell>
      {(shell) => (
        <TeacherDashboard
          sidebarOpen={shell.sidebarOpen}
          onToggleSidebar={shell.onToggleSidebar}
        />
      )}
    </TeacherShell>
  );
}
