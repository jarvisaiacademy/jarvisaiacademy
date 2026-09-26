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

interface AdminTeacherDetailProps {
  teacherId: string;
  shell: AdminShellState;
}

/** Format ISO timestamp into Indian English locale */
function formatWhen(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
                  title="Edit Teacher"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Teacher</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Identity Bar (No card wrapper) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar user={teacher} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {teacher.name || "Unnamed Teacher"}
                  </span>
                  <span className="text-xs text-neutral-500 truncate">{teacher.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RoleBadge role={accountRoleOf(teacher)} />
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
              </div>
            </div>

            {/* 4-GRID (Data on Top, Label Below — No insider card boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Full Name */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {teacher.name || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Full Name
                </span>
              </div>

              {/* 2. Email Address */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {teacher.email || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Email Address
                </span>
              </div>

              {/* 3. Title / Designation */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {teacher.title || "Faculty Member"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Title / Designation
                </span>
              </div>

              {/* 4. Phone Number */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {teacher.phone || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Phone Number
                </span>
              </div>

              {/* 5. Specialization & Expertise (spans 2 columns on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {teacher.specialization || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Specialization & Expertise
                </span>
              </div>

              {/* 6. Account Status (spans 1 column on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-1 lg:col-span-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {teacher.status || "active"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Account Status
                </span>
              </div>

              {/* 7. Assigned Courses (spans 1 column on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-1 lg:col-span-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {teaches.length} {teaches.length === 1 ? "Course" : "Courses"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Assigned Courses
                </span>
              </div>

              {/* Assigned Course Badges */}
              {teaches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4 -mt-2">
                  {teaches.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/courses/${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10 hover:border-emerald-500 transition-colors"
                    >
                      <span className="font-bold opacity-60">#{c.number}</span>
                      <span>{c.title}</span>
                      <ChevronRight className="w-3 h-3 text-neutral-400" />
                    </Link>
                  ))}
                </div>
              )}

              {/* 8. Biography & Teaching Experience (spans all 4 columns) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-normal text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {teacher.bio || "No biography provided."}
                </p>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Biography & Teaching Experience
                </span>
              </div>

              {/* Additional Account Metadata Row in 4-grid */}
              {/* Last Sign-in */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(teacher.lastLoginAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Last Sign-in
                </span>
              </div>

              {/* Account Created */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(teacher.createdAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Account Created
                </span>
              </div>

              {/* Super10 Status */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {teacher.is_super10 ? "Super10 Scholar" : "Standard"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Super10 Status
                </span>
              </div>

              {/* Email Verification */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {teacher.emailVerified ? "Verified" : "Unverified"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Email Verification
                </span>
              </div>
            </div>
          </div>

          {/* Card Footer: Metadata (Created on left, Updated on right in continuous string) */}
          <div className="px-5 sm:px-7 py-4 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 bg-neutral-50/50 dark:bg-white/[0.02] text-xs">
            {/* Bottom Left: Created by [Name] on [Date] */}
            <div className="text-neutral-500 dark:text-neutral-400">
              <span>Created by </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {createdAuthorName}
              </span>
              <span> on </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {formatWhen(teacher.createdAt)}
              </span>
            </div>

            {/* Bottom Right: Updated by [Name] on [Date] */}
            <div className="text-neutral-500 dark:text-neutral-400 text-left sm:text-right">
              <span>Updated by </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {updatedAuthorName}
              </span>
              <span> on </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {formatWhen(teacher.updatedAt || teacher.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminTeacherDetail;
