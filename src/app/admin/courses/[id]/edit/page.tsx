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
      {/* Keyed on the id: the form seeds every field from the course in its own state
          initialiser, so a different course has to be a different component. */}
      {(shell) => <CourseEditorPage key={params.id} courseId={params.id} shell={shell} />}
    </AdminShell>
  );
}
