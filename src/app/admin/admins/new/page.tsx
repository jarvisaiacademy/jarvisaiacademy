"use client";

import { AdminEditorPage } from "@/components/admin/admin-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Creating an administrator, at its own URL. The gate, the sidebar and the absence of SEO come from
 * `AdminShell` and the `/admin` layout, which this segment inherits.
 */
export default function AdminNewAdminRoute() {
  return (
    <AdminShell defaultTab="admins" restoreTab={false}>
      {(shell) => <AdminEditorPage shell={shell} />}
    </AdminShell>
  );
}
