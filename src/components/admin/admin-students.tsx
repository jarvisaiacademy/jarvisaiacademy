"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  Search,
  Eye,
  Pencil,
  Trash2,
  Sparkles,
  BookOpen,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Select } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";
import {
  deleteStudentInFirestore,
  updateCandidateInFirestore,
  syncStudentEnrollments,
} from "@/services/students-service";
import { useAllEnrollments } from "@/hooks/use-student-enrollments";
import { accountRoleOf, type CandidateStatus, type StudentRecord } from "@/data/students";
import type { CourseItem } from "@/data/courses";
import { resolvedReferralCode } from "@/data/referrals";

interface AdminStudentsProps {
  onHome: () => void;
}

function getStudentAdmissionStatus(
  student: StudentRecord,
  coursesMap: Map<string, CourseItem[]>,
  overrides: Record<string, "enrolled" | "not_enrolled">
): "enrolled" | "not_enrolled" {
  if (overrides[student.id]) {
    return overrides[student.id];
  }
  if (student.admission_status === "enrolled" || student.admissionStatus === "enrolled") {
    return "enrolled";
  }
  if (student.admission_status === "not_enrolled" || student.admissionStatus === "not_enrolled") {
    return "not_enrolled";
  }
  const enrolledCourses = coursesMap.get(student.id) || [];
  if (enrolledCourses.length > 0 || (student.enrolledCourseIds && student.enrolledCourseIds.length > 0)) {
    return "enrolled";
  }
  return "not_enrolled";
}

export function AdminStudents({ onHome }: AdminStudentsProps) {
  const { students, loading: studentsLoading, error: studentsError, refreshStudents } = useStudents();
  const { firestoreCourses: courses, loading: coursesLoading } = useCourses();
  const { enrollments, loading: enrollmentsLoading } = useAllEnrollments();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [admissionFilter, setAdmissionFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admission & Course Enrollment Modal State
  const [localAdmissionStatus, setLocalAdmissionStatus] = useState<Record<string, "enrolled" | "not_enrolled">>({});
  const [enrollingStudent, setEnrollingStudent] = useState<StudentRecord | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false);
  const [isTogglingAdmission, setIsTogglingAdmission] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  // Filter students (non-teachers, non-admins)
  const studentList = useMemo(
    () => students.filter((s) => accountRoleOf(s) === "student"),
    [students]
  );

  // Map courses per student (combines student.enrolledCourseIds with enrollments collection)
  const coursesByStudentEmail = useMemo(() => {
    const map = new Map<string, typeof courses>();
    for (const student of studentList) {
      const email = (student.email || "").toLowerCase();
      const directIds = new Set<string>(student.enrolledCourseIds || []);

      // Also gather courses from enrollments collection
      if (email) {
        for (const e of enrollments) {
          if ((e.studentEmail || "").toLowerCase() === email && e.action === "paid") {
            directIds.add(e.courseId);
          }
        }
      }

      const assignedCourses = courses.filter((c) => directIds.has(c.id));
      map.set(student.id, assignedCourses);
    }
    return map;
  }, [studentList, enrollments, courses]);

  // Enrolled and Not Enrolled counts across students
  const { enrolledCount, notEnrolledCount } = useMemo(() => {
    let enrolled = 0;
    let notEnrolled = 0;
    for (const s of studentList) {
      const status = getStudentAdmissionStatus(s, coursesByStudentEmail, localAdmissionStatus);
      if (status === "enrolled") {
        enrolled++;
      } else {
        notEnrolled++;
      }
    }
    return { enrolledCount: enrolled, notEnrolledCount: notEnrolled };
  }, [studentList, coursesByStudentEmail, localAdmissionStatus]);

  // Filtering
  const filteredStudents = useMemo(() => {
    let result = studentList;

    if (statusFilter !== "all") {
      result = result.filter((s) => (s.status ?? "active") === statusFilter);
    }

    if (admissionFilter !== "all") {
      result = result.filter((s) => {
        const adm = getStudentAdmissionStatus(s, coursesByStudentEmail, localAdmissionStatus);
        return adm === admissionFilter;
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((s) => {
        const nameMatch = (s.name || "").toLowerCase().includes(q);
        const emailMatch = (s.email || "").toLowerCase().includes(q);
        const titleMatch = (s.title || "").toLowerCase().includes(q);
        const specMatch = (s.specialization || "").toLowerCase().includes(q);
        const phoneMatch = (s.phone || "").toLowerCase().includes(q);
        const refMatch = resolvedReferralCode(s.id, s.referralCode).toLowerCase().includes(q);
        const enrolled = coursesByStudentEmail.get(s.id) || [];
        const courseMatch = enrolled.some((c) =>
          c.title.toLowerCase().includes(q)
        );
        const adm = getStudentAdmissionStatus(s, coursesByStudentEmail, localAdmissionStatus);
        const admMatch = (adm === "enrolled" ? "enrolled" : "not enrolled").includes(q);
        return (
          nameMatch ||
          emailMatch ||
          titleMatch ||
          specMatch ||
          phoneMatch ||
          refMatch ||
          courseMatch ||
          admMatch
        );
      });
    }

    return result;
  }, [studentList, statusFilter, admissionFilter, searchQuery, coursesByStudentEmail, localAdmissionStatus]);

  // Paged slice
  const pagedStudents = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  const handleAdmissionFilterChange = (val: string) => {
    setAdmissionFilter(val);
    setCurrentPage(0);
  };

  // Filtered courses in enrollment modal
  const filteredModalCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.number && c.number.toString().includes(q)) ||
        (c.level && c.level.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  // Open course enrollment modal
  const openCourseModal = (student: StudentRecord) => {
    const enrolledCourses = coursesByStudentEmail.get(student.id) || [];
    const directIds = (student.enrolledCourseIds && student.enrolledCourseIds.length > 0)
      ? student.enrolledCourseIds
      : enrolledCourses.map((c) => c.id);

    setSelectedCourseIds(Array.from(new Set(directIds)));
    setCourseSearch("");
    setEnrollingStudent(student);
  };

  // Click on Admission Status column (click to toggle status)
  const handleAdmissionClick = async (student: StudentRecord) => {
    if (isTogglingAdmission === student.id) return;
    const currentStatus = getStudentAdmissionStatus(
      student,
      coursesByStudentEmail,
      localAdmissionStatus
    );

    if (currentStatus === "enrolled") {
      // If currently enrolled: click to change to Not Enrolled
      setIsTogglingAdmission(student.id);
      setLocalAdmissionStatus((prev) => ({ ...prev, [student.id]: "not_enrolled" }));
      try {
        const cleanEmail = student.email?.trim().toLowerCase() || "";
        const cleanName = student.name?.trim() || "Student";

        await updateCandidateInFirestore(
          student.id,
          {
            admission_status: "not_enrolled",
            enrolledCourseIds: [],
          },
          user?.email,
          user?.name
        );

        if (cleanEmail) {
          await syncStudentEnrollments(
            cleanEmail,
            cleanName,
            [],
            courses,
            user?.email
          );
        }

        await refreshStudents();
        showToast(`${cleanName} marked as Not Enrolled`, "info");
      } catch (err: unknown) {
        showToast(
          err instanceof Error ? err.message : "Failed to change admission status",
          "error"
        );
        // Rollback
        setLocalAdmissionStatus((prev) => ({ ...prev, [student.id]: "enrolled" }));
      } finally {
        setIsTogglingAdmission(null);
      }
    } else {
      // If currently not enrolled: click to change to Enrolled AND open enrollment popup
      setIsTogglingAdmission(student.id);
      setLocalAdmissionStatus((prev) => ({ ...prev, [student.id]: "enrolled" }));
      try {
        await updateCandidateInFirestore(
          student.id,
          { admission_status: "enrolled" },
          user?.email,
          user?.name
        );
      } catch (err) {
        console.warn("Could not optimistically set admission_status:", err);
      } finally {
        setIsTogglingAdmission(null);
      }

      openCourseModal(student);
    }
  };

  // Save courses and confirm enrollment from modal
  const handleSaveEnrollment = async () => {
    if (!enrollingStudent) return;
    setIsSavingEnrollment(true);
    try {
      const cleanEmail = enrollingStudent.email?.trim().toLowerCase() || "";
      const cleanName = enrollingStudent.name?.trim() || "Student";

      await updateCandidateInFirestore(
        enrollingStudent.id,
        {
          enrolledCourseIds: selectedCourseIds,
          admission_status: "enrolled",
        },
        user?.email,
        user?.name
      );

      if (cleanEmail) {
        await syncStudentEnrollments(
          cleanEmail,
          cleanName,
          selectedCourseIds,
          courses,
          user?.email
        );
      }

      setLocalAdmissionStatus((prev) => ({
        ...prev,
        [enrollingStudent.id]: "enrolled",
      }));

      await refreshStudents();
      showToast(`Enrollment updated for ${cleanName}`, "success");
      setEnrollingStudent(null);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update enrollment",
        "error"
      );
    } finally {
      setIsSavingEnrollment(false);
    }
  };

  // Mark as Not Enrolled from modal
  const handleMarkNotEnrolled = async () => {
    if (!enrollingStudent) return;
    setIsSavingEnrollment(true);
    try {
      const cleanEmail = enrollingStudent.email?.trim().toLowerCase() || "";
      const cleanName = enrollingStudent.name?.trim() || "Student";

      await updateCandidateInFirestore(
        enrollingStudent.id,
        {
          enrolledCourseIds: [],
          admission_status: "not_enrolled",
        },
        user?.email,
        user?.name
      );

      if (cleanEmail) {
        await syncStudentEnrollments(
          cleanEmail,
          cleanName,
          [],
          courses,
          user?.email
        );
      }

      setLocalAdmissionStatus((prev) => ({
        ...prev,
        [enrollingStudent.id]: "not_enrolled",
      }));

      await refreshStudents();
      showToast(`${cleanName} marked as Not Enrolled`, "info");
      setEnrollingStudent(null);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update admission status",
        "error"
      );
    } finally {
      setIsSavingEnrollment(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllCourses = () => {
    setSelectedCourseIds(courses.map((c) => c.id));
  };

  const handleClearAllCourses = () => {
    setSelectedCourseIds([]);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStudents();
      showToast("Student roster refreshed", "success");
    } catch {
      showToast("Failed to refresh students list", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle quick status
  const handleToggleStatus = async (student: StudentRecord) => {
    const current = student.status ?? "active";
    const next: CandidateStatus = current === "active" ? "inactive" : "active";

    try {
      await updateCandidateInFirestore(student.id, { status: next }, user?.email);
      showToast(
        `Student marked as ${next === "active" ? "Active" : "Inactive"}`,
        "success"
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update student status",
        "error"
      );
    }
  };

  // Delete or deactivate student
  const handleDeleteStudent = async (student: StudentRecord, permanent: boolean) => {
    setIsDeleting(true);
    try {
      await deleteStudentInFirestore(student.id, {
        permanent,
        userEmail: user?.email,
        studentEmail: student.email,
      });

      showToast(
        permanent ? "Student account permanently deleted" : "Student account marked inactive",
        "success"
      );
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete student",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const isDataLoading =
    (studentsLoading || coursesLoading || enrollmentsLoading) && students.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb at the top left side outside the list card */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onHome}
          className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">
          Students
        </span>
      </nav>

      {/* Big Student List Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Inside Card Header Bar */}
        <div className="p-4 sm:p-5 flex flex-col gap-5 border-b border-neutral-200 dark:border-white/10">
          <div className="relative flex items-center justify-between gap-3 min-h-[38px]">
            {/* Back button inside the card */}
            <div className="flex items-center z-10">
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* In the Center: Students Heading with Refresh icon at its side */}
            <div className="w-full sm:w-auto sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Students
                </h2>
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={handleRefresh}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh Student Roster"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Right placeholder to balance back button */}
            <div className="w-[72px] invisible hidden sm:block" aria-hidden="true" />
          </div>

          {/* Search bar at right side & data above label at left side */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            {/* Left side: count data above label in normal text size (Students, Enrolled, Not Enrolled) */}
            <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
              <button
                type="button"
                onClick={() => handleAdmissionFilterChange("all")}
                className={`flex flex-col text-left transition-opacity cursor-pointer ${
                  admissionFilter === "all" ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
                title="Show all students"
              >
                <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                  {studentList.length}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Students
                </span>
              </button>

              <div className="h-6 w-px bg-neutral-200 dark:bg-white/10" />

              <button
                type="button"
                onClick={() =>
                  handleAdmissionFilterChange(admissionFilter === "enrolled" ? "all" : "enrolled")
                }
                className={`flex flex-col text-left transition-opacity cursor-pointer ${
                  admissionFilter === "enrolled" ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
                title="Filter by enrolled students"
              >
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
                  {enrolledCount}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enrolled
                </span>
              </button>

              <div className="h-6 w-px bg-neutral-200 dark:bg-white/10" />

              <button
                type="button"
                onClick={() =>
                  handleAdmissionFilterChange(admissionFilter === "not_enrolled" ? "all" : "not_enrolled")
                }
                className={`flex flex-col text-left transition-opacity cursor-pointer ${
                  admissionFilter === "not_enrolled" ? "opacity-100" : "opacity-60 hover:opacity-100"
                }`}
                title="Filter by not enrolled students"
              >
                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 leading-tight">
                  {notEnrolledCount}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Not Enrolled
                </span>
              </button>
            </div>

            {/* Right side: Search bar, Admission filter, and Status filter */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end flex-wrap sm:flex-nowrap">
              <Select
                label="Filter by admission"
                value={admissionFilter}
                onValueChange={handleAdmissionFilterChange}
                options={[
                  { value: "all", label: "All Admissions" },
                  { value: "enrolled", label: "Enrolled" },
                  { value: "not_enrolled", label: "Not Enrolled" },
                ]}
                className="w-36 py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs whitespace-nowrap"
              />

              <Select
                label="Filter by status"
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active Only" },
                  { value: "inactive", label: "Inactive" },
                ]}
                className="w-36 py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs whitespace-nowrap"
              />
            
              <div className="relative w-full sm:w-36">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Student</th>
                <th className="py-3 px-4 sm:px-6">Enroll Courses</th>
                <th className="py-3 px-4 sm:px-6">Admission Status</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {isDataLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400 animate-pulse">
                    Loading student records...
                  </td>
                </tr>
              ) : pagedStudents.length > 0 ? (
                pagedStudents.map((student) => {
                  const isInactive = student.status === "inactive";
                  const enrolled = coursesByStudentEmail.get(student.id) || [];
                  const admissionStatus = getStudentAdmissionStatus(
                    student,
                    coursesByStudentEmail,
                    localAdmissionStatus
                  );
                  const isAdmissionEnrolled = admissionStatus === "enrolled";

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Student Profile */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={student} size="md" />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900 dark:text-white truncate">
                                {student.name || "Unnamed Student"}
                              </span>
                              {student.is_super10 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Super10</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-neutral-500 truncate">
                              {student.email}
                            </span>
                            {student.phone && (
                              <span className="text-[10px] text-neutral-400 mt-0.5 truncate">
                                {student.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Enroll Courses */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {enrolled.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openCourseModal(student)}
                            className="flex flex-wrap items-center gap-1.5 max-w-xs text-left cursor-pointer hover:opacity-80 transition-opacity"
                            title="Click to manage enrolled courses"
                          >
                            {enrolled.slice(0, 3).map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-white/5"
                              >
                                <span className="font-mono text-neutral-500 dark:text-neutral-400">
                                  #{c.number}
                                </span>
                                <span className="truncate max-w-[120px]">{c.title}</span>
                              </span>
                            ))}
                            {enrolled.length > 3 && (
                              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 self-center px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/5">
                                +{enrolled.length - 3} more
                              </span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCourseModal(student)}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer italic"
                            title="Click to assign courses"
                          >
                            <span>No courses enrolled</span>
                          </button>
                        )}
                      </td>

                      {/* Admission Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isTogglingAdmission === student.id}
                            onClick={() => handleAdmissionClick(student)}
                            className="inline-flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50"
                            title={`Click to change to ${isAdmissionEnrolled ? "Not Enrolled" : "Enrolled"}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAdmissionEnrolled ? "bg-emerald-500" : "bg-neutral-400"
                              }`}
                            />
                            <span
                              className={
                                isAdmissionEnrolled
                                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                  : "text-neutral-500 dark:text-neutral-400"
                              }
                            >
                              {isAdmissionEnrolled ? "Enrolled" : "Not Enrolled"}
                            </span>
                          </button>

                          {isAdmissionEnrolled && (
                            <button
                              type="button"
                              onClick={() => openCourseModal(student)}
                              className="p-1 rounded-md text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Edit enrolled courses"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status - Plain text with indicator without rounded card */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(student)}
                          className="inline-flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          title={`Click to ${isInactive ? "activate" : "deactivate"} student`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isInactive ? "bg-neutral-400" : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={
                              isInactive
                                ? "text-neutral-500 dark:text-neutral-400"
                                : "text-emerald-600 dark:text-emerald-400 font-semibold"
                            }
                          >
                            {isInactive ? "Inactive" : "Active"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Link - Blue */}
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="p-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Link - Orange */}
                          <Link
                            href={`/admin/students/${student.id}/edit`}
                            className="p-1.5 rounded-lg text-white bg-orange-500 hover:bg-orange-600 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          {/* Delete Action with Confirmation - Red */}
                          {deleteConfirmId === student.id ? (
                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteStudent(student, false)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded cursor-pointer disabled:opacity-50"
                                title="Mark account as inactive"
                              >
                                Deactivate
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteStudent(student, true)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded cursor-pointer disabled:opacity-50"
                                title="Delete account permanently"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1 text-[10px] text-neutral-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(student.id)}
                              className="p-1.5 rounded-lg text-white bg-red-600 hover:bg-red-500 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Delete or Deactivate Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400">
                    {studentsError ? (
                      <div className="flex flex-col items-center gap-2 text-amber-600 dark:text-amber-400 py-4">
                        <p className="text-xs font-semibold">Permission error loading student accounts</p>
                        <p className="text-[11px] text-neutral-500 max-w-md text-center">
                          Firestore denied read access. Please verify that your account has <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">role: &quot;admin&quot;</code> in the <code className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">users</code> collection in Firebase Console.
                        </p>
                      </div>
                    ) : studentList.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-xs">No students registered yet.</p>
                      </div>
                    ) : searchQuery.trim() ? (
                      "No students match your search query."
                    ) : (
                      "No students found with this status."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredStudents.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(0);
          }}
          noun="students"
        />
      </div>

      {/* Course Enrollment Modal Popup */}
      <AnimatePresence>
        {enrollingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            {/* Modal backdrop click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => {
                if (!isSavingEnrollment) setEnrollingStudent(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={enrollingStudent} size="md" />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-tight truncate">
                      Course Enrollment
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      {enrollingStudent.name || "Student"} &bull; {enrollingStudent.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEnrollingStudent(null)}
                  disabled={isSavingEnrollment}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar & Clear Action */}
              <div className="p-3 sm:px-5 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02] flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                {selectedCourseIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllCourses}
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-2 py-1 cursor-pointer font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Courses List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 mb-1">
                  <span>
                    Select courses to assign ({selectedCourseIds.length} selected)
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllCourses}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                </div>

                {filteredModalCourses.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    No courses found
                  </div>
                ) : (
                  filteredModalCourses.map((course) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => toggleCourseSelection(course.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                            : "bg-white dark:bg-white/[0.02] border-neutral-200/80 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                              #{course.number}
                            </span>
                            <span className="text-xs font-semibold truncate text-neutral-900 dark:text-white">
                              {course.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                            {course.categoryLabel && <span>{course.categoryLabel}</span>}
                            {course.level && <span>&bull; {course.level}</span>}
                            {course.fee && <span>&bull; {course.fee}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:px-5 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isSavingEnrollment}
                  onClick={handleMarkNotEnrolled}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Mark student as Not Enrolled and clear course assignments"
                >
                  Mark as Not Enrolled
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingEnrollment}
                    onClick={() => setEnrollingStudent(null)}
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEnrollment}
                    onClick={handleSaveEnrollment}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingEnrollment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Enrollment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
