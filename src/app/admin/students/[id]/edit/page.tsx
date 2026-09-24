"use client";

import { useParams } from "next/navigation";
import { StudentEditorPage } from "@/components/admin/student-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Editing one student, at its own URL — so editing survives a refresh and can be opened in
 * a tab with standard back-navigation.
 */
export default function AdminEditStudentRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="students" restoreTab={false}>
      {(shell) => <StudentEditorPage studentId={params.id} shell={shell} />}
    </AdminShell>
  );
}
