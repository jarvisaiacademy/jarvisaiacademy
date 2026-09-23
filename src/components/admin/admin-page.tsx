"use client";

import React from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface AdminPageProps {
  shell: AdminShellState;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

/**
 * The frame a `/admin` route that is not the tab list draws around itself: the header, the
 * page's own scrolling column.
 *
 * `AdminShell` supplies the gate and the sidebar, but its `<main>` has no padding — the
 * dashboard fills that in for itself. Three routes need the same fill (a course, its editor,
 * a new course), so it lives here rather than three times over; a page that forgot the header
 * would have no way to open the sidebar on mobile at all.
 */
export function AdminPage({
  shell,
  children,
  maxWidth = "max-w-7xl px-4 sm:px-8",
  className = "",
}: AdminPageProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      <AdminHeader sidebarOpen={shell.sidebarOpen} onToggleSidebar={shell.onToggleSidebar} />
      <main className={`flex-1 w-full mx-auto py-6 sm:py-8 flex flex-col gap-6 sm:gap-8 ${maxWidth} ${className}`}>
        {children}
      </main>
    </div>
  );
}

export default AdminPage;
