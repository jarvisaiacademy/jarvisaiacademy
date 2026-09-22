"use client";

import { useParams } from "next/navigation";
import { TeacherEditorPage } from "@/components/admin/teacher-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Editing one teacher, at its own URL — so editing survives a refresh and can be opened in
 * a tab with standard back-navigation.
 */
export default function AdminEditTeacherRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="teachers" restoreTab={false}>
      {(shell) => <TeacherEditorPage teacherId={params.id} shell={shell} />}
    </AdminShell>
  );
}
