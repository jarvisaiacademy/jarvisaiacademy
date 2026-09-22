"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight } from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateCandidateInFirestore } from "@/services/students-service";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AdminPage } from "@/components/admin/admin-page";
import { Field } from "@/components/admin/detail-field";
import { RoleBadge } from "@/components/admin/role-badge";
import { accountRoleOf, type CandidateStatus } from "@/data/students";
import { isPublic } from "@/lib/courses-server";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface AdminTeacherDetailProps {
  teacherId: string;
  /** The shell's chrome, so this page can drive the sidebar and go back to the tab list. */
  shell: AdminShellState;
}

/** An ISO timestamp as something an admin reads, or an em dash when there is nothing to read. */
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

/**
 * One account, read-only, with the flag that makes it a teacher and the courses it is on.
 *
 * It exists because a course page names its faculty and nothing linked anywhere: `teacherIds` are
 * user ids, and the roster lists accounts in a paged table an admin would have to search by hand.
 *
 * Faculty is the `is_teacher` flag and nothing else — a course's `teacherIds` are not what makes
 * someone a teacher, so the courses below are read off the catalogue and the toggle writes the
 * flag. Unmarking here does not unassign them; the course keeps the id until an admin edits it.
 */
export function AdminTeacherDetail({ teacherId, shell }: AdminTeacherDetailProps) {
  const { students, loading } = useStudents();
  const { firestoreCourses, loading: coursesLoading } = useCourses();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isBusy, setIsBusy] = useState(false);

  const teacher = students.find((s) => s.id === teacherId);

  // By id rather than a filter per id, to put a name to `referredBy`.
  const studentById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // The other direction of the same link the course view reads: a course names its teachers, so
  // the courses this account teaches are the ones that name it.
  const teaches = useMemo(
    () => firestoreCourses.filter((course) => (course.teacherIds ?? []).includes(teacherId)),
    [firestoreCourses, teacherId]
  );

  const goToTeachers = () => shell.onNavigateTab("teachers");

  const handleToggleTeacher = async () => {
    if (!teacher) return;
    const next = teacher.is_teacher !== true;
    setIsBusy(true);
    try {
      await updateCandidateInFirestore(teacher.id, { is_teacher: next }, user?.email);
      showToast(next ? "Marked as faculty" : "Faculty mark removed", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update this account", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const crumbs = (
    <PageHeader
      crumbs={[
        { label: "Home", onSelect: () => shell.onNavigateTab("home") },
        { label: "Teachers", onSelect: goToTeachers },
        { label: teacher?.name || teacher?.email || "Account" },
      ]}
      action={
        teacher ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={handleToggleTeacher}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border shadow-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
              teacher.is_teacher
                ? "bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30"
                : "bg-sky-600 border-sky-600 text-white hover:bg-sky-500"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{teacher.is_teacher ? "Remove Teacher" : "Mark as Teacher"}</span>
          </button>
        ) : undefined
      }
    />
  );

  const chrome = (children: React.ReactNode) => <AdminPage shell={shell}>{children}</AdminPage>;

  // `loading` covers the roster; `coursesLoading` is what the Teaches list below is waiting on, and
  // without it that list would say "not on any course" for a frame on every load.
  if (loading || coursesLoading) {
    return chrome(
      <>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading account...
        </div>
      </>
    );
  }

  if (!teacher) {
    return chrome(
      <>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No account with this id. It may have been deleted, or the link may be wrong.
          </p>
          <button
            type="button"
            onClick={goToTeachers}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Teachers
          </button>
        </div>
      </>
    );
  }

  const status: CandidateStatus = teacher.status ?? "active";
  const statusBadge =
    status === "active"
      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
      : status === "banned"
        ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
        : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10";

  return (
    <>
      {chrome(
        <>
          {crumbs}

          <section className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
              <UserAvatar user={teacher} size="md" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                  {teacher.name || "Unnamed account"}
                </h1>
                <span className="text-[11px] text-neutral-500 truncate">{teacher.email}</span>
              </div>
              <RoleBadge role={accountRoleOf(teacher)} />
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge}`}
              >
                {status === "active" ? "Active" : status === "banned" ? "Banned" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
              <Field label="Email" className="col-span-2">
                {teacher.email || "—"}
              </Field>
              <Field label="Plan">{teacher.plan || "—"}</Field>
              <Field label="Super10">{teacher.is_super10 ? "Yes" : "No"}</Field>

              <Field label="Sign-in provider">{teacher.signInProvider || "—"}</Field>
              <Field label="Email verified">{teacher.emailVerified ? "Yes" : "No"}</Field>
              <Field label="Account created" className="col-span-2">
                {formatWhen(teacher.createdAt)}
              </Field>

              <Field label="Last sign-in" className="col-span-2">
                {formatWhen(teacher.lastLoginAt)}
              </Field>
              <Field label="Referral code">{teacher.referralCode || "—"}</Field>
              <Field label="Signed up with">{teacher.referredByCode || "—"}</Field>

              <Field label="Referred by" className="col-span-2">
                {teacher.referredBy
                  ? studentById.get(teacher.referredBy)?.name ||
                    studentById.get(teacher.referredBy)?.email ||
                    teacher.referredBy
                  : "—"}
              </Field>
            </div>
          </section>

          {/* The other half of what an admin comes here for: which courses this account is on. Each
              row goes to that course's own page, which is the same view that links back here. */}
          <section className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Teaches
              <span className="ml-2 text-[11px] font-medium text-neutral-400">
                {teaches.length} {teaches.length === 1 ? "course" : "courses"}
              </span>
            </h2>

            {teaches.length === 0 ? (
              <span className="text-xs text-neutral-400">
                Not assigned to any course yet. Assign them from a course&apos;s Assigned teachers
                field.
              </span>
            ) : (
              <ul className="flex flex-col gap-2 list-none">
                {teaches.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                        #{course.number}
                      </span>
                      <span className="flex-1 min-w-0 text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {course.title}
                      </span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isPublic(course)
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                            : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                        }`}
                      >
                        {isPublic(course) ? "Active" : "Inactive"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default AdminTeacherDetail;
