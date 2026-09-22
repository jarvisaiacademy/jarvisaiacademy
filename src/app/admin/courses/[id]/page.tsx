"use client";

import { useParams } from "next/navigation";
import { AdminCourseDetail } from "@/components/admin/admin-course-detail";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * One course, at its own URL, so a refresh or a shared link lands on the course rather than
 * on the dashboard's default tab.
 *
 * The gate, the sidebar and the absence of SEO come from `AdminShell` and the `/admin` layout,
 * which this segment inherits — `restoreTab={false}` because this is a page that belongs to one
 * tab, and restoring another would highlight a panel that is not on screen.
 */
export default function AdminCourseRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="courses" restoreTab={false}>
      {(shell) => <AdminCourseDetail courseId={params.id} shell={shell} />}
    </AdminShell>
  );
}
