"use client";

import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { TeacherProfile } from "@/components/admin/teacher-profile";

/**
 * One teacher's profile, at its own URL so it can be linked and reloaded.
 *
 * `restoreTab` is off: the sidebar highlights Teachers because that is the tab this page
 * belongs to, not because it happens to be the tab the session last used.
 */
export default function TeacherProfileRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="teachers" restoreTab={false}>
      {(shell) => (
        <TeacherProfile
          teacherId={String(params.id)}
          onBack={() => shell.onNavigateTab("teachers")}
        />
      )}
    </AdminShell>
  );
}
