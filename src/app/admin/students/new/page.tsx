"use client";

import { StudentEditorPage } from "@/components/admin/student-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Creating a student, at its own URL. The gate, the sidebar and the absence of SEO come from
 * `AdminShell` and the `/admin` layout, which this segment inherits.
 */
export default function AdminNewStudentRoute() {
  return (
    <AdminShell defaultTab="students" restoreTab={false}>
      {(shell) => <StudentEditorPage shell={shell} />}
    </AdminShell>
  );
}
