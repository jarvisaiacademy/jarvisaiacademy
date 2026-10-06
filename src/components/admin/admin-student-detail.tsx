"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Pencil, Trash2, Copy, Check, Users } from "lucide-react";
import { resolvedReferralCode } from "@/data/referrals";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { useAllEnrollments } from "@/hooks/use-student-enrollments";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/admin/role-badge";
import { AdminPage } from "@/components/admin/admin-page";
import { accountRoleOf, type CandidateStatus } from "@/data/students";
import { deleteStudentInFirestore, updateCandidateInFirestore } from "@/services/students-service";
import {
  useStudentReferrals,
  ALL_REFERRAL_STATUSES,
  STATUS_CONFIG,
  normalizeStatus,
  type ReferralCandidateStatus,
} from "@/hooks/use-student-referrals";
import type { AdminShellState } from "@/components/admin/admin-shell";
import { formatDateTime } from "@/lib/date-format";

interface AdminStudentDetailProps {
  studentId: string;
  shell: AdminShellState;
}

/** Format ISO timestamp into Indian English locale */
function formatWhen(iso?: string) {
  return formatDateTime(iso);
}

export function AdminStudentDetail({ studentId, shell }: AdminStudentDetailProps) {
  const router = useRouter();
  const { students, loading } = useStudents();
  const { firestoreCourses, loading: coursesLoading } = useCourses();
  const { enrollments, loading: enrollmentsLoading } = useAllEnrollments();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const student = students.find((s) => s.id === studentId);
  const matchingStudentByEmail = student?.email
    ? students.find(
        (s) =>
          s.email?.toLowerCase() === student.email?.toLowerCase() &&
          s.id !== student.id
      )
    : undefined;

  const referredByStudent = student?.referredBy
    ? students.find((s) => s.id === student.referredBy)
    : undefined;
  const referredStudents = student
    ? students.filter((s) => s.referredBy === student.id).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const effectiveReferralCode =
    student?.referralCode || matchingStudentByEmail?.referralCode;

  const studentReferralCode = student?.id
    ? resolvedReferralCode(student.id, effectiveReferralCode)
    : "—";

  useEffect(() => {
    if (!student?.id || !studentReferralCode || studentReferralCode === "—") return;
    if (student.referralCode !== studentReferralCode) {
      updateCandidateInFirestore(student.id, { referralCode: studentReferralCode }, user?.email).catch((err) => {
        console.warn("[AdminStudentDetail] Could not heal referral code:", err);
      });
    }
  }, [student?.id, student?.referralCode, studentReferralCode, user?.email]);

  const handleCopyReferralCode = () => {
    if (studentReferralCode && studentReferralCode !== "—") {
      navigator.clipboard.writeText(studentReferralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const {
    candidates: hookCandidates,
    loading: referralsLoading,
    updateCandidateStatus,
  } = useStudentReferrals(
    studentId,
    studentReferralCode && studentReferralCode !== "—" ? studentReferralCode : undefined
  );

  // Combine real candidates from useStudentReferrals and real accounts from students roster
  const allReferredCandidates = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; course: string; date: string; status: ReferralCandidateStatus }
    >();

    for (const c of hookCandidates) {
      map.set(c.id, c);
    }

    if (student) {
      for (const s of students) {
        const isReferred =
          (s.referredBy && s.referredBy === student.id) ||
          (studentReferralCode && studentReferralCode !== "—" && s.referredByCode === studentReferralCode) ||
          (effectiveReferralCode && s.referredByCode === effectiveReferralCode);

        if (isReferred && !map.has(s.id)) {
          const course =
            s.enrolledCourseIds?.length && firestoreCourses.length
              ? firestoreCourses.find((fc) => s.enrolledCourseIds?.includes(fc.id))?.title ||
                "Full Stack AI Engineering"
              : "Full Stack AI Engineering";

          map.set(s.id, {
            id: s.id,
            name: s.name || s.email?.split("@")[0] || "Referred Student",
            course,
            date: formatWhen(s.referredAt || s.createdAt),
            status: normalizeStatus(s.referralStatus),
          });
        }
      }
    }

    return Array.from(map.values());
  }, [hookCandidates, student, students, studentReferralCode, effectiveReferralCode, firestoreCourses]);

  const totalCount = allReferredCandidates.length;
  const enquiryCount = allReferredCandidates.filter((u) => u.status === "Enquiry").length;
  const admissionCount = allReferredCandidates.filter((u) => u.status === "Admission Completed").length;
  const ongoingCount = allReferredCandidates.filter((u) => u.status === "Course Ongoing").length;
  const completedCount = allReferredCandidates.filter((u) => u.status === "Course Completed").length;

  const filteredCandidates = useMemo(() => {
    if (selectedFilter === "All") return allReferredCandidates;
    return allReferredCandidates.filter((u) => u.status === selectedFilter);
  }, [selectedFilter, allReferredCandidates]);

  const getStatusCount = (status: ReferralCandidateStatus) => {
    switch (status) {
      case "Enquiry":
        return enquiryCount;
      case "Admission Completed":
        return admissionCount;
      case "Course Ongoing":
        return ongoingCount;
      case "Course Completed":
        return completedCount;
      default:
        return 0;
    }
  };

  const handleUpdateStatus = async (candidateId: string, nextStatus: ReferralCandidateStatus) => {
    try {
      await updateCandidateStatus(candidateId, nextStatus);
      await updateCandidateInFirestore(candidateId, { referralStatus: nextStatus }, user?.email);
      showToast(`Candidate status updated to "${nextStatus}"`, "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStudentInFirestore(studentId, {
        permanent: true,
        userEmail: user?.email,
        studentEmail: student?.email,
      });
      showToast("Student deleted successfully", "success");
      goToStudents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete student";
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

  const createdAuthorName = resolveAuthorName(student?.createdBy);
  const updatedAuthorName = resolveAuthorName(student?.updatedBy || student?.createdBy);

  // The courses this student is enrolled in (combines direct IDs and enrollments collection)
  const directCourseIds = new Set<string>(student?.enrolledCourseIds || []);
  const studentEmail = (student?.email || "").toLowerCase();

  if (studentEmail) {
    for (const e of enrollments) {
      if ((e.studentEmail || "").toLowerCase() === studentEmail && e.action === "paid") {
        directCourseIds.add(e.courseId);
      }
    }
  }

  const enrolledCourses = firestoreCourses.filter((course) => directCourseIds.has(course.id));

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
  const courseBadgeLabel =
    enrolledCourses.length > 0
      ? enrolledCourses.map((c) => c.title).join(" · ")
      : null;

  return (
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
        {breadcrumbNav}

        {/* Big Card matching Teacher Details */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header: Back button on left, centered Heading Student Details, Edit & Delete on right */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
            <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-h-[38px]">
              {/* Left: Back button */}
              <div className="flex items-center z-10">
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

              {/* Center: Heading Student Details */}
              <div className="w-full sm:w-auto sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none order-first sm:order-none">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center pointer-events-auto">
                  Student Details
                </h1>
              </div>

              {/* Top Right: Delete (Red) + Edit Student (Orange) */}
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
                    title="Delete Student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <Link
                  href={`/admin/students/${student.id}/edit`}
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
            {/* Identity bar — referral line left; status/role above, course below on the right */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <UserAvatar user={student} size="lg" />
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-bold text-neutral-900 dark:text-white truncate">
                    {student.name || "Unnamed Student"}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <span
                      className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 tracking-wide"
                      title="Referral code"
                    >
                      {studentReferralCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReferralCode}
                      className="inline-flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                      title="Copy Referral Code"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <span className="text-neutral-300 dark:text-neutral-600 select-none" aria-hidden>
                      •
                    </span>
                    <span className="truncate" title="Email">
                      {student.email || "—"}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600 select-none" aria-hidden>
                      •
                    </span>
                    <span title="Phone">{student.phone || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[280px] max-w-lg shrink-0 ml-auto">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {student.is_super10 === true && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-red-600 dark:text-red-400 border border-emerald-200 dark:border-emerald-500/30">
                      Super10
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : status === "banned"
                          ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
                          : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        status === "active"
                          ? "bg-emerald-500"
                          : status === "banned"
                            ? "bg-red-500"
                            : "bg-neutral-400"
                      }`}
                    />
                    <span>
                      {status === "active" ? "Active" : status === "banned" ? "Banned" : "Inactive"}
                    </span>
                  </span>
                  <RoleBadge role={accountRoleOf(student)} />
                </div>

                <div className="flex justify-end w-full min-w-0">
                  {courseBadgeLabel ? (
                    enrolledCourses.length === 1 ? (
                      <Link
                        href={`/admin/courses/${enrolledCourses[0].id}`}
                        className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-neutral-900 dark:text-emerald-100 border border-emerald-100 dark:border-emerald-500/25 hover:border-emerald-300 dark:hover:border-emerald-400/50 transition-colors max-w-full min-w-0 ml-auto"
                      >
                        <span className="truncate">{courseBadgeLabel}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-neutral-900 dark:text-emerald-100 border border-emerald-100 dark:border-emerald-500/25 max-w-full min-w-0 ml-auto">
                        <span className="truncate">{courseBadgeLabel}</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 ml-auto">
                      No course enrolled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Account Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-neutral-200 dark:border-white/10">
              {/* Referred By */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {referredByStudent?.name || referredByStudent?.email || student.referredBy || (student.referredByCode ? `Code: ${student.referredByCode}` : "Direct Sign-up")}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Referred By
                </span>
              </div>

              {/* Last Sign-in */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {formatWhen(student.lastLoginAt)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Last Sign-in
                </span>
              </div>
            </div>


            {/* Referred Candidates Table */}
            <div className="rounded-2xl border border-neutral-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1c1c1c]">
              <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                    Referred Candidates ({filteredCandidates.length}{selectedFilter !== "All" ? ` of ${totalCount}` : ""})
                  </h3>
                  {referralsLoading && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-500 animate-pulse">
                      Syncing...
                    </span>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-3 border-b border-neutral-200/60 dark:border-white/5 overflow-x-auto no-scrollbar bg-neutral-50/50 dark:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setSelectedFilter("All")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedFilter === "All"
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  All ({totalCount})
                </button>
                {ALL_REFERRAL_STATUSES.map((status) => {
                  const count = getStatusCount(status);
                  const isSelected = selectedFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                          : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                    >
                      <span>{status}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-white/20 text-white dark:bg-neutral-900/20 dark:text-neutral-900"
                            : "bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Candidates Rows */}
              {filteredCandidates.length > 0 ? (
                <div className="flex flex-col divide-y divide-neutral-200/60 dark:divide-white/5">
                  {filteredCandidates.map((person) => {
                    const initials = person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={person.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Left: Avatar + Candidate Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-semibold text-xs shrink-0 ring-1 ring-neutral-200 dark:ring-white/10">
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {person.name}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 shrink-0 hidden sm:inline-block">
                                {person.course}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                              <span className="sm:hidden truncate">{person.course} · </span>
                              <span>Referred on {person.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: The 4 Statuses in a Horizontal Line */}
                        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 pl-12 lg:pl-0">
                          {ALL_REFERRAL_STATUSES.map((status, sIdx) => {
                            const isActive = person.status === status;
                            const cfg = STATUS_CONFIG[status];
                            return (
                              <React.Fragment key={status}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(person.id, status)}
                                  title={`Set status to "${status}"`}
                                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                      ? `${cfg.badgeClass} ring-1 font-semibold shadow-xs`
                                      : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-500 border border-neutral-200/60 dark:border-white/5 hover:text-neutral-600 dark:hover:text-neutral-400"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                      isActive
                                        ? cfg.dotClass
                                        : "bg-neutral-300 dark:bg-neutral-600"
                                    }`}
                                  />
                                  <span>{status}</span>
                                </button>

                                {sIdx < ALL_REFERRAL_STATUSES.length - 1 && (
                                  <div
                                    className="h-0.5 w-2 sm:w-3 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800"
                                    aria-hidden="true"
                                  />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-2.5" />
                  <p className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {selectedFilter === "All"
                      ? "No referred candidates yet"
                      : `No candidates in "${selectedFilter}" status`}
                  </p>
                  {selectedFilter !== "All" && (
                    <button
                      type="button"
                      onClick={() => setSelectedFilter("All")}
                      className="mt-2.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
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
              <span>{formatWhen(student.createdAt)}</span>
            </div>

            {/* Bottom Right: Updated by [Name] on [Date] */}
            <div className="text-left sm:text-right">
              <span>Updated by </span>
              <span>{updatedAuthorName}</span>
              <span> on </span>
              <span>{formatWhen(student.updatedAt || student.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminStudentDetail;
