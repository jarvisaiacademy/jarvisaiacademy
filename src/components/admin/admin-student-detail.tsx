"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Pencil, Sparkles } from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAllEnrollments } from "@/hooks/use-student-enrollments";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/admin/role-badge";
import { AdminPage } from "@/components/admin/admin-page";
import { accountRoleOf, type CandidateStatus } from "@/data/students";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface AdminStudentDetailProps {
  studentId: string;
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

export function AdminStudentDetail({ studentId, shell }: AdminStudentDetailProps) {
  const router = useRouter();
  const { students, loading } = useStudents();
  const { firestoreCourses, loading: coursesLoading } = useCourses();
  const { enrollments, loading: enrollmentsLoading } = useAllEnrollments();

  const student = students.find((s) => s.id === studentId);

  // The courses this student is enrolled in (combines direct IDs and enrollments collection)
  const enrolledCourses = useMemo(() => {
    if (!student) return [];
    const directIds = new Set<string>(student.enrolledCourseIds || []);
    const email = (student.email || "").toLowerCase();

    if (email) {
      for (const e of enrollments) {
        if ((e.studentEmail || "").toLowerCase() === email && e.action === "paid") {
          directIds.add(e.courseId);
        }
      }
    }

    return firestoreCourses.filter((course) => directIds.has(course.id));
  }, [student, enrollments, firestoreCourses]);

  const goToStudents = () => {
    shell.onNavigateTab("students");
    router.push("/admin");
  };

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
        onClick={goToStudents}
        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
      >
        Students
      </button>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
      <span className="font-semibold text-neutral-900 dark:text-white">
        Student Details
      </span>
    </nav>
  );

  // Loading state
  if (loading || (students.length === 0 && !student) || coursesLoading || enrollmentsLoading) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-10 text-center text-xs text-neutral-400 animate-pulse">
            Loading student details...
          </div>
        </div>
      </AdminPage>
    );
  }

  // Not found state
  if (!student) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No student account found with this ID. It may have been removed or the link is incorrect.
            </p>
            <button
              type="button"
              onClick={goToStudents}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Back to Students
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  const status: CandidateStatus = student.status ?? "active";

  return (
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
        {breadcrumbNav}

        {/* Big Card matching Teacher Details */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header: Back button on left, centered Heading Student Details */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              {/* Back button inside the card */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={goToStudents}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  title="Back to Students"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Center: Heading */}
              <div className="flex items-center justify-center">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center">
                  Student Details
                </h1>
              </div>

              {/* Spacer to balance the Back button for mathematical centering */}
              <div className="w-[72px] invisible" aria-hidden="true" />
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Identity Bar (No card wrapper) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar user={student} size="md" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-900 dark:text-white truncate">
                      {student.name || "Unnamed Student"}
                    </span>
                    {student.is_super10 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Sparkles className="w-3 h-3" />
                        <span>Super10 Scholar</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-500 truncate">{student.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RoleBadge role={accountRoleOf(student)} />
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
                  {student.name || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Full Name
                </span>
              </div>

              {/* 2. Email Address */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {student.email || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Email Address
                </span>
              </div>

              {/* 3. Target Track / Goal */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {student.title || "Learner"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Target Track / Goal
                </span>
              </div>

              {/* 4. Phone Number */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {student.phone || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Phone Number
                </span>
              </div>

              {/* 5. Specialization & Interests (spans 2 columns on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {student.specialization || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Specialization & Interests
                </span>
              </div>

              {/* 6. Account Status (spans 1 column on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-1 lg:col-span-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {student.status || "active"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Account Status
                </span>
              </div>

              {/* 7. Enrolled Courses (spans 1 column on lg) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-1 lg:col-span-1">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {enrolledCourses.length} {enrolledCourses.length === 1 ? "Course" : "Courses"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enrolled Courses
                </span>
              </div>

              {/* Enrolled Course Badges */}
              {enrolledCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4 -mt-2">
                  {enrolledCourses.map((c) => (
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

              {/* 8. Biography & Student Notes (spans all 4 columns) */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-normal text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {student.bio || "No student notes or biography provided."}
                </p>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Biography & Student Notes
                </span>
              </div>

              {/* Additional Account Metadata Row in 4-grid */}
              {/* Last Sign-in */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(student.lastLoginAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Last Sign-in
                </span>
              </div>

              {/* Account Created */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(student.createdAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Account Created
                </span>
              </div>

              {/* Super10 Status */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {student.is_super10 ? "Super10 Scholar" : "Standard"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Super10 Status
                </span>
              </div>

              {/* Email Verification */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {student.emailVerified ? "Verified" : "Unverified"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Email Verification
                </span>
              </div>

              {/* Referral Code */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {student.referralCode || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Referral Code
                </span>
              </div>

              {/* Referred By */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {student.referredBy || (student.referredByCode ? `Code: ${student.referredByCode}` : "Direct Sign-up")}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Referred By
                </span>
              </div>
            </div>
          </div>

          {/* Card Footer: Back on left, Edit Student green pill button on right */}
          <div className="px-5 sm:px-7 py-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/[0.02]">
            {/* Bottom Left: Back button */}
            <button
              type="button"
              onClick={goToStudents}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Students</span>
            </button>

            {/* Bottom Right: Edit Student green pill button */}
            <Link
              href={`/admin/students/${student.id}/edit`}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Student</span>
            </Link>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminStudentDetail;
