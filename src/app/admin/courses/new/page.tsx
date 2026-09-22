"use client";

import { CourseEditorPage } from "@/components/admin/course-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Creating a course, at its own URL. The gate, the sidebar and the absence of SEO come from
 * `AdminShell` and the `/admin` layout, which this segment inherits.
 */
export default function AdminNewCourseRoute() {
  return (
    <AdminShell defaultTab="courses" restoreTab={false}>
      {(shell) => <CourseEditorPage shell={shell} />}
    </AdminShell>
  );
}
