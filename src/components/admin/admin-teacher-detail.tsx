"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/admin/role-badge";
import { AdminPage } from "@/components/admin/admin-page";
import { accountRoleOf, type CandidateStatus } from "@/data/students";
import { deleteTeacherInFirestore } from "@/services/students-service";
import { removeTeacherFromAllCourses } from "@/services/courses-service";
import type { AdminShellState } from "@/components/admin/admin-shell";
import { formatDateTime } from "@/lib/date-format";

interface AdminTeacherDetailProps {
  teacherId: string;
  shell: AdminShellState;
}

/** Format ISO timestamp into Indian English locale */
function formatWhen(iso?: string) {
  return formatDateTime(iso);
}

export function AdminTeacherDetail({ teacherId, shell }: AdminTeacherDetailProps) {
  const router = useRouter();
  const { students, loading } = useStudents();
  const { firestoreCourses, loading: coursesLoading } = useCourses();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const teacher = students.find((s) => s.id === teacherId);

  // The courses this teacher instructs
  const teaches = useMemo(
    () => firestoreCourses.filter((course) => (course.teacherIds ?? []).includes(teacherId)),
    [firestoreCourses, teacherId]
  );

  const goToTeachers = () => {
    shell.onNavigateTab("teachers");
    router.push("/admin");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeTeacherFromAllCourses(teacherId, user?.email);
      await deleteTeacherInFirestore(teacherId, {
        permanent: true,
        userEmail: user?.email,
        teacherEmail: teacher?.email,
      });
      showToast("Teacher deleted successfully", "success");
      goToTeachers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete teacher";
      showToast(msg, "error");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const resolveAuthorName = (author?: string) => {
    if (!author || author === "Admin") {
      return user?.name && user.name !== "Learner" ? user.name : "Admin";
    }
    if (user && (author === user.email || author === user.id)) {
      return user.name || author;
    }
    const match = students.find((s) => s.id === author || s.email === author);
    if (match?.name) {
      return match.name;
    }
    if (author.includes("@")) {
      const [localPart] = author.split("@");
      return localPart
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return author;
  };

  const createdAuthorName = resolveAuthorName(teacher?.createdBy);
  const updatedAuthorName = resolveAuthorName(teacher?.updatedBy || teacher?.createdBy);

  // Breadcrumb at top left outside the card
  const breadcrumbNav = (
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
        onClick={goToTeachers}
        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
      >
        Teachers
      </button>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
      <span className="font-semibold text-neutral-900 dark:text-white">
        Teacher Details
      </span>
    </nav>
  );

  // Loading state
  if (loading || (students.length === 0 && !teacher) || coursesLoading) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-10 text-center text-xs text-neutral-400 animate-pulse">
            Loading teacher details...
          </div>
        </div>
      </AdminPage>
    );
  }

  // Not found state
  if (!teacher) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No teacher account found with this ID. It may have been removed or the link is incorrect.
            </p>
            <button
              type="button"
              onClick={goToTeachers}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Back to Teachers
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  const status: CandidateStatus = teacher.status ?? "active";

  return (
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
        {breadcrumbNav}

        {/* Big Card matching Add/Edit Teacher pages */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header: Back button on left, centered Heading Teacher Details, Edit & Delete on right */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
            <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-h-[38px]">
              {/* Left: Back button */}
              <div className="flex items-center z-10">
                <button
                  type="button"
                  onClick={goToTeachers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  title="Back to Teachers"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Center: Heading Teacher Details */}
              <div className="w-full sm:w-auto sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none order-first sm:order-none">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center pointer-events-auto">
                  Teacher Details
                </h1>
              </div>

              {/* Top Right: Delete (Red) + Edit Teacher (Orange) */}
              <div className="flex items-center gap-2 z-10 ml-auto sm:ml-0">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 p-1 rounded-xl border border-red-200 dark:border-red-500/30">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded-lg cursor-pointer disabled:opacity-60"
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-xs transition-colors cursor-pointer"
                    title="Delete Teacher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <Link
                  href={`/admin/teachers/${teacher.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors cursor-pointer"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Identity Bar matching Student View — teacher info left; status/role above, specialization badge below on the right */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar user={teacher} size="lg" />
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                    {teacher.name || "Unnamed Teacher"}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <span className="truncate" title="Email">
                      {teacher.email || "—"}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600 select-none" aria-hidden>
                      •
                    </span>
                    <span title="Phone">{teacher.phone || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[280px] max-w-lg shrink-0 ml-auto">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === "active" ? "bg-emerald-500" : "bg-neutral-400"
                      }`}
                    />
                    <span>{status === "active" ? "Active" : "Inactive"}</span>
                  </span>
                  <RoleBadge role={accountRoleOf(teacher)} />
                </div>

                {/* Specialization & Expertise Badge matching Student View course badge */}
                <div className="flex justify-end w-full min-w-0">
                  {teacher.specialization ? (
                    <span
                      className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-neutral-900 dark:text-emerald-100 border border-emerald-100 dark:border-emerald-500/25 max-w-full min-w-0 ml-auto"
                      title="Specialization & Expertise"
                    >
                      <span className="truncate">{teacher.specialization}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 ml-auto">
                      General Faculty
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Account Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-neutral-200 dark:border-white/10">
              {/* Title / Designation */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {teacher.title || "Faculty Member"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Title / Designation
                </span>
              </div>

              {/* Last Sign-in */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(teacher.lastLoginAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Last Sign-in
                </span>
              </div>
            </div>

            {/* Assigned Courses Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                  Assigned Courses ({teaches.length})
                </h3>
              </div>

              {teaches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {teaches.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/courses/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors shadow-2xs"
                    >
                      <span className="font-bold opacity-60">#{c.number}</span>
                      <span>{c.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-white/[0.02]">
                  No courses assigned to this teacher yet.
                </div>
              )}
            </div>
          </div>

          {/* Card Footer: Metadata (Created on left, Updated on right in continuous string) */}
          <div className="px-5 sm:px-7 py-3.5 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 bg-neutral-50/50 dark:bg-white/[0.02] text-[11px] font-normal text-neutral-500 dark:text-neutral-400">
            {/* Bottom Left: Created by [Name] on [Date] */}
            <div>
              <span>Created by </span>
              <span>{createdAuthorName}</span>
              <span> on </span>
              <span>{formatWhen(teacher.createdAt)}</span>
            </div>

            {/* Bottom Right: Updated by [Name] on [Date] */}
            <div className="text-left sm:text-right">
              <span>Updated by </span>
              <span>{updatedAuthorName}</span>
              <span> on </span>
              <span>{formatWhen(teacher.updatedAt || teacher.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminTeacherDetail;
