"use client";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * The dashboard. The gate, the sidebar and the open tab live in `AdminShell`, which every
 * `/admin` route renders through; this page is only the tab list.
 */
export default function AdminRoute() {
  return (
    <AdminShell defaultTab="home">
      {(shell) => (
        <AdminDashboard
          activeTab={shell.activeTab}
          onChangeTab={shell.onSelectTab}
          sidebarOpen={shell.sidebarOpen}
          onToggleSidebar={shell.onToggleSidebar}
        />
      )}
    </AdminShell>
  );
}
