"use client";

import { useParams } from "next/navigation";
import { AdminTeacherDetail } from "@/components/admin/admin-teacher-detail";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * One account, at its own URL, so a course page's teacher can be clicked through to and a link to
 * them survives a refresh.
 *
 * The gate, the sidebar and the absence of SEO come from `AdminShell` and the `/admin` layout,
 * which this segment inherits — `restoreTab={false}` because this is a page that belongs to one
 * tab, and restoring another would highlight a panel that is not on screen.
 */
export default function AdminTeacherRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="teachers" restoreTab={false}>
      {(shell) => <AdminTeacherDetail teacherId={params.id} shell={shell} />}
    </AdminShell>
  );
}
