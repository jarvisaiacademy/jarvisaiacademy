"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { AdminPage } from "@/components/admin/admin-page";
import {
  createAdminInFirestore,
  updateCandidateInFirestore,
} from "@/services/students-service";
import type { AdminShellState } from "@/components/admin/admin-shell";
import type { CandidateStatus, StudentRecord } from "@/data/students";

interface AdminEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating an admin */
  adminId?: string;
}

export function AdminEditorPage({ adminId, shell }: AdminEditorPageProps) {
  const router = useRouter();
  const { students, loading: studentsLoading } = useStudents();

  const admin = adminId ? students.find((s) => s.id === adminId) : null;

  // Waiting on the roster subscription
  if (adminId && (studentsLoading || students.length === 0)) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("home");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("admins");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Admins
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Loading...
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading admin details...
        </div>
      </AdminPage>
    );
  }

  if (adminId && !admin) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("home");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("admins");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Admins
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Not Found
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No admin account with this id. It may have been removed or the link is incorrect.
          </p>
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("admins");
              router.push("/admin");
            }}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Admins
          </button>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminForm
      key={admin?.id ?? "new"}
      admin={admin ?? null}
      shell={shell}
    />
  );
}

interface AdminFormProps {
  admin: StudentRecord | null;
  shell: AdminShellState;
}

function AdminForm({ admin, shell }: AdminFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { students } = useStudents();

  // Mode: "manual" (enter new details) or "promote" (select an existing user)
  const [createMode, setCreateMode] = useState<"manual" | "promote">("manual");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Filter non-admin users for promote option
  const nonAdminUsers = useMemo(
    () => students.filter((s) => s.role !== "admin"),
    [students]
  );

  const [name, setName] = useState(() => admin?.name ?? "");
  const [email, setEmail] = useState(() => admin?.email ?? "");
  const [title, setTitle] = useState(() => admin?.title ?? "");
  const [specialization, setSpecialization] = useState(() => admin?.specialization ?? "");
  const [phone, setPhone] = useState(() => admin?.phone ?? "");
  const [bio, setBio] = useState(() => admin?.bio ?? "");
  const [status, setStatus] = useState<CandidateStatus>(() =>
    admin?.status === "inactive" || admin?.status === "banned" ? "inactive" : "active"
  );
  const [isSaving, setIsSaving] = useState(false);

  // When an existing user is picked in promote mode, pre-fill their name & email
  const handleSelectUserToPromote = (userId: string) => {
    setSelectedUserId(userId);
    const found = nonAdminUsers.find((s) => s.id === userId);
    if (found) {
      setName(found.name || "");
      setEmail(found.email || "");
      if (found.phone) setPhone(found.phone);
      if (found.title) setTitle(found.title);
      if (found.specialization) setSpecialization(found.specialization);
    }
  };

  const handleCancel = () => {
    if (admin) {
      router.push(`/admin/admins/${admin.id}`);
    } else {
      shell.onNavigateTab("admins");
      router.push("/admin");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Admin name is required", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showToast("A valid email address is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (admin) {
        // UPDATE existing admin
        await updateCandidateInFirestore(
          admin.id,
          {
            name: cleanName,
            email: cleanEmail,
            role: "admin",
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
          },
          user?.email
        );
      } else {
        // CREATE new admin or PROMOTE existing account
        await createAdminInFirestore(
          {
            name: cleanName,
            email: cleanEmail,
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
            existingUserId:
              createMode === "promote" && selectedUserId ? selectedUserId : undefined,
          },
          user?.email
        );
      }

      showToast(
        admin
          ? `Admin "${cleanName}" updated successfully`
          : `Admin "${cleanName}" created successfully`,
        "success"
      );

      if (admin) {
        router.push(`/admin/admins/${admin.id}`);
      } else {
        shell.onNavigateTab("admins");
        router.push("/admin");
      }
    } catch (err: unknown) {
      console.error("[AdminForm] Failed to save admin:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("permission-denied")
      ) {
        showToast(
          `Permission denied for ${user?.email || "this account"}. Verified admin permissions required.`,
          "error"
        );
      } else {
        showToast(errMsg || "Failed to save admin", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("home");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("admins");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Admins
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {admin ? `Edit ${admin.name || "Admin"}` : "Add Admin"}
          </span>
        </nav>

        {/* Big Card containing form */}
        <form onSubmit={handleSubmit} className="w-full pb-16">
          <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
            {/* Header: Back button on left, centered Heading */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                {/* Back button inside the card */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                    title="Back to Admins"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                {/* Center: Heading Add New Admin */}
                <div className="flex items-center justify-center">
                  <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center">
                    {admin ? "Edit Admin" : "Add New Admin"}
                  </h1>
                </div>

                {/* Spacer to balance the Back button for mathematical centering */}
                <div className="w-[72px] invisible" aria-hidden="true" />
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* Creator Mode Selector (Only on New Admin) */}
              {!admin && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Admin Source
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Create a new administrator account directly or promote an existing user.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-200/60 dark:bg-white/5 border border-neutral-200 dark:border-white/10 self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCreateMode("manual")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        createMode === "manual"
                          ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>New Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreateMode("promote")}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        createMode === "promote"
                          ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Promote Registered User</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Existing User Picker (in Promote mode) */}
              {!admin && createMode === "promote" && (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Select User Account to Promote to Administrator</span>
                  </div>

                  {nonAdminUsers.length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No registered user accounts available to promote. Use &quot;New Profile&quot; instead.
                    </p>
                  ) : (
                    <Select
                      label="Select account to promote"
                      value={selectedUserId}
                      onValueChange={handleSelectUserToPromote}
                      options={nonAdminUsers.map((s) => ({
                        value: s.id,
                        label: `${s.name || "Unnamed"} (${s.email})`,
                      }))}
                      className="py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                    />
                  )}
                </div>
              )}

              {/* 4-GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sugat Raj"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@jarvisaiacademy.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Title / Designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Platform Administrator"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Specialization & Responsibilities (spans 2 columns on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Specialization & Department
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Security, Curriculum Operations, Infrastructure & Billing"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 6. Account Status (spans 1 column on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Account Status
                  </label>
                  <Select
                    label="Account Status"
                    value={status}
                    onValueChange={(val) => setStatus(val as CandidateStatus)}
                    options={[
                      { value: "active", label: "Active Administrator" },
                      { value: "inactive", label: "Inactive / Suspended" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 7. Authority Level (spans 1 column on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Authority Level
                  </label>
                  <Select
                    label="Authority Level"
                    value="full"
                    onValueChange={() => {}}
                    options={[
                      { value: "full", label: "Full Administrative Access" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 8. Biography & Internal Notes (spans all 4 columns) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Biography & Internal Administrative Notes
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter internal notes, organizational role, primary contact responsibilities..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Cancel on left with cancel icon, Add / Save Admin pill button on right */}
            <div className="px-5 sm:px-7 py-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/[0.02]">
              {/* Bottom Left: Cancel button with cancel icon */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              {/* Bottom Right: Add / Save Admin pill button */}
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : admin ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{admin ? "Save Changes" : "Add Admin"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}
