"use client";

import { TeacherEditorPage } from "@/components/admin/teacher-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Creating a teacher, at its own URL. The gate, the sidebar and the absence of SEO come from
 * `AdminShell` and the `/admin` layout, which this segment inherits.
 */
export default function AdminNewTeacherRoute() {
  return (
    <AdminShell defaultTab="teachers" restoreTab={false}>
      {(shell) => <TeacherEditorPage shell={shell} />}
    </AdminShell>
  );
}
