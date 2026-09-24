"use client";

import { useParams } from "next/navigation";
import { AdminEditorPage } from "@/components/admin/admin-editor-page";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Editing one administrator, at its own URL — so editing survives a refresh and can be opened in
 * a tab with standard back-navigation.
 */
export default function AdminEditAdminRoute() {
  const params = useParams<{ id: string }>();

  return (
    <AdminShell defaultTab="admins" restoreTab={false}>
      {(shell) => <AdminEditorPage adminId={params.id} shell={shell} />}
    </AdminShell>
  );
}
