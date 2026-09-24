"use client";

import { useParams } from "next/navigation";
import { AdminAdminDetail } from "@/components/admin/admin-admin-detail";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * One administrator account, at its own URL, so an admin profile survives a refresh
 * and can be viewed with standard back navigation.
 */
export default function AdminAdminRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="admins" restoreTab={false}>
      {(shell) => <AdminAdminDetail adminId={params.id} shell={shell} />}
    </AdminShell>
  );
}
