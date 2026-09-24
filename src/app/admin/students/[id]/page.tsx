"use client";

import { useParams } from "next/navigation";
import { AdminStudentDetail } from "@/components/admin/admin-student-detail";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * One student account, at its own URL, so a student can be clicked through to and a link to
 * them survives a refresh.
 *
 * The gate, the sidebar and the absence of SEO come from `AdminShell` and the `/admin` layout,
 * which this segment inherits.
 */
export default function AdminStudentRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="students" restoreTab={false}>
      {(shell) => <AdminStudentDetail studentId={params.id} shell={shell} />}
    </AdminShell>
  );
}
