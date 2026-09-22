"use client";

import { useParams } from "next/navigation";
import { CourseEditorPage } from "@/components/admin/course-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Editing one course, at its own URL — so a long form survives a refresh and can be opened in
 * a tab, which a modal could not do.
 */
export default function AdminEditCourseRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="courses" restoreTab={false}>
      {/* No key needed here: the page holds no state until it has resolved the course, and keys
          the form on that course itself. */}
      {(shell) => <CourseEditorPage courseId={params.id} shell={shell} />}
    </AdminShell>
  );
}
