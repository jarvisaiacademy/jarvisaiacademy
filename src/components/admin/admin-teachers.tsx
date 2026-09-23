"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";
import {
  deleteTeacherInFirestore,
  updateCandidateInFirestore,
} from "@/services/students-service";
import { removeTeacherFromAllCourses } from "@/services/courses-service";
import type { CandidateStatus, StudentRecord } from "@/data/students";

interface AdminTeachersProps {
  onHome: () => void;
}

export function AdminTeachers({ onHome }: AdminTeachersProps) {
  const { students, loading: studentsLoading } = useStudents();
  const { firestoreCourses: courses, loading: coursesLoading } = useCourses();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  // All faculty members
  const teachers = useMemo(
    () => students.filter((s) => s.is_teacher === true),
    [students]
  );

  // Map courses per teacher
  const coursesByTeacherId = useMemo(() => {
    const map = new Map<string, typeof courses>();
    for (const teacher of teachers) {
      map.set(
        teacher.id,
        courses.filter((c) => (c.teacherIds ?? []).includes(teacher.id))
      );
    }
    return map;
  }, [teachers, courses]);

  // Quick statistics
  const activeTeachersCount = useMemo(
    () => teachers.filter((t) => (t.status ?? "active") === "active").length,
    [teachers]
  );

  const coursesCoveredCount = useMemo(() => {
    const assignedIds = new Set<string>();
    courses.forEach((c) => {
      if ((c.teacherIds ?? []).length > 0) assignedIds.add(c.id);
    });
    return assignedIds.size;
  }, [courses]);

  // Filtering
  const filteredTeachers = useMemo(() => {
    let result = teachers;

    if (statusFilter !== "all") {
      result = result.filter((t) => (t.status ?? "active") === statusFilter);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((t) => {
        const nameMatch = (t.name || "").toLowerCase().includes(q);
        const emailMatch = (t.email || "").toLowerCase().includes(q);
        const titleMatch = (t.title || "").toLowerCase().includes(q);
        const specMatch = (t.specialization || "").toLowerCase().includes(q);
        const taughtCourses = coursesByTeacherId.get(t.id) || [];
        const courseMatch = taughtCourses.some((c) =>
          c.title.toLowerCase().includes(q)
        );
        return nameMatch || emailMatch || titleMatch || specMatch || courseMatch;
      });
    }

    return result;
  }, [teachers, statusFilter, searchQuery, coursesByTeacherId]);

  // Paged slice
  const pagedTeachers = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  // Toggle quick status
  const handleToggleStatus = async (teacher: StudentRecord) => {
    const current = teacher.status ?? "active";
    const next: CandidateStatus = current === "active" ? "inactive" : "active";

    try {
      await updateCandidateInFirestore(teacher.id, { status: next }, user?.email);
      showToast(
        `Teacher marked as ${next === "active" ? "Active" : "Inactive"}`,
        "success"
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update teacher status",
        "error"
      );
    }
  };

  // Delete or unmark teacher
  const handleDeleteTeacher = async (teacherId: string, permanent: boolean) => {
    setIsDeleting(true);
    try {
      // 1. Remove from all courses
      await removeTeacherFromAllCourses(teacherId, user?.email);

      // 2. Remove or unmark teacher record
      await deleteTeacherInFirestore(teacherId, {
        permanent,
        userEmail: user?.email,
      });

      showToast(
        permanent ? "Teacher profile permanently deleted" : "Faculty status removed",
        "success"
      );
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to remove teacher",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <PageHeader
        crumbs={[{ label: "Home", onSelect: onHome }, { label: "Teachers" }]}
        action={
          <Link
            href="/admin/teachers/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Teacher</span>
          </Link>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Total Faculty</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {teachers.length}
          </span>
          <span className="text-[11px] text-neutral-400">Instructors and mentors</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Active Faculty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeTeachersCount}
          </span>
          <span className="text-[11px] text-neutral-400">Currently taking batches</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Courses Assigned</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
            {coursesCoveredCount} / {courses.length}
          </span>
          <span className="text-[11px] text-neutral-400">Programs with faculty leads</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-sky-500" />
              <span>Faculty Directory</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Manage instructor profiles, course teaching allocations, and faculty status.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search teachers or courses..."
                className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <Select
              label="Filter by status"
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive" },
                { value: "banned", label: "Banned" },
              ]}
              className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Teacher</th>
                <th className="py-3 px-4 sm:px-6">Designation & Expertise</th>
                <th className="py-3 px-4 sm:px-6">Teaches</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {studentsLoading || coursesLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400 animate-pulse">
                    Loading faculty records...
                  </td>
                </tr>
              ) : pagedTeachers.length > 0 ? (
                pagedTeachers.map((teacher) => {
                  const taughtCourses = coursesByTeacherId.get(teacher.id) || [];
                  const isBanned = teacher.status === "banned";
                  const isInactive = teacher.status === "inactive";

                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Teacher Profile */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={teacher} size="md" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-neutral-900 dark:text-white truncate">
                              {teacher.name || "Unnamed Teacher"}
                            </span>
                            <span className="text-[11px] text-neutral-500 truncate">
                              {teacher.email}
                            </span>
                            {teacher.phone && (
                              <span className="text-[10px] text-neutral-400">
                                {teacher.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Designation & Specialization */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col gap-1 max-w-xs">
                          <span className="font-medium text-neutral-900 dark:text-neutral-200">
                            {teacher.title || "Faculty Member"}
                          </span>
                          {teacher.specialization ? (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                              {teacher.specialization}
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">
                              No domain specified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Teaches (Assigned Courses) */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {taughtCourses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {taughtCourses.map((c) => (
                              <Link
                                key={c.id}
                                href={`/admin/courses/${c.id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors"
                              >
                                <span className="opacity-60">#{c.number}</span>
                                <span className="truncate max-w-[120px]">{c.title}</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">
                            No courses assigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(teacher)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                            isBanned
                              ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
                              : isInactive
                              ? "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isBanned
                                ? "bg-red-500"
                                : isInactive
                                ? "bg-neutral-400"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span>
                            {isBanned ? "Banned" : isInactive ? "Inactive" : "Active"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Link */}
                          <Link
                            href={`/admin/teachers/${teacher.id}`}
                            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                            title="View Teacher Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Link */}
                          <Link
                            href={`/admin/teachers/${teacher.id}/edit`}
                            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edit Teacher"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          {/* Delete Action with Confirmation */}
                          {deleteConfirmId === teacher.id ? (
                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteTeacher(teacher.id, false)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded cursor-pointer disabled:opacity-50"
                                title="Unmark faculty role"
                              >
                                Unmark
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteTeacher(teacher.id, true)}
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
                              onClick={() => setDeleteConfirmId(teacher.id)}
                              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete or Remove Teacher"
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
                    {teachers.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <Briefcase className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-xs">No teachers registered yet.</p>
                        <Link
                          href="/admin/teachers/new"
                          className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs"
                        >
                          Add Your First Teacher
                        </Link>
                      </div>
                    ) : searchQuery.trim() ? (
                      "No teachers match your search query."
                    ) : (
                      "No teachers found with this status."
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
          total={filteredTeachers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(0);
          }}
          noun="teachers"
        />
      </div>
    </div>
  );
}
