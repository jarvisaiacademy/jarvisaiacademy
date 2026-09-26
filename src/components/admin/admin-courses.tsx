"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  Plus,
  RotateCcw,
  Search,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { DevIcon } from "@/components/ui/dev-icon";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";
import { stackDisplay, type CourseItem, type CourseStatus } from "@/data/courses";

interface AdminCoursesProps {
  onHome: () => void;
}

export function AdminCourses({ onHome }: AdminCoursesProps) {
  const { firestoreCourses, loading: coursesLoading, editCourse, removeCourse, refreshCourses } = useCourses();
  const { students, loading: studentsLoading } = useStudents();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  // Map student/teacher IDs to user records for the teacher cell
  const studentsById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  // Filtering
  const filteredCourses = useMemo(() => {
    let result = firestoreCourses;

    // Filter by category
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((c) => (c.status ?? "active") === statusFilter);
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((c) => {
        const titleMatch = (c.title || "").toLowerCase().includes(q);
        const descMatch = (c.description || "").toLowerCase().includes(q);
        const idMatch = (c.id || "").toLowerCase().includes(q);
        const techMatch = (c.techStack || []).some((t) => t.toLowerCase().includes(q));
        const topicMatch = (c.topics || []).some((t) => t.toLowerCase().includes(q));
        const teacherMatch = (c.teacherIds || []).some((tid) => {
          const teacher = studentsById.get(tid);
          return (teacher?.name || "").toLowerCase().includes(q) || (teacher?.email || "").toLowerCase().includes(q);
        });
        return titleMatch || descMatch || idMatch || techMatch || topicMatch || teacherMatch;
      });
    }

    return result;
  }, [firestoreCourses, categoryFilter, statusFilter, searchQuery, studentsById]);

  // Paginated slice
  const pagedCourses = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredCourses.slice(start, start + pageSize);
  }, [filteredCourses, currentPage, pageSize]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCourses();
      showToast("Course directory refreshed", "success");
    } catch {
      showToast("Failed to refresh courses", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (course: CourseItem) => {
    const isCurrentlyActive = (course.status ?? "active") === "active";
    const nextStatus: CourseStatus = isCurrentlyActive ? "inactive" : "active";
    try {
      await editCourse(course.id, { status: nextStatus });
      showToast(
        nextStatus === "active" ? `"${course.title}" is listed publicly` : `"${course.title}" is hidden`,
        "success"
      );
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to update course status",
        "error"
      );
    }
  };

  // Delete course
  const handleDeleteCourse = async (courseId: string) => {
    setIsDeleting(true);
    try {
      await removeCourse(courseId);
      showToast("Course deleted successfully", "success");
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete course",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Render teacher names in teacher cell without images
  const renderTeacherCell = (course: CourseItem) => {
    const assigned = (course.teacherIds ?? [])
      .map((id) => {
        const u = studentsById.get(id);
        if (!u) return null;
        return {
          id,
          name: u.name || "Unnamed",
          email: u.email,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (assigned.length === 0) {
      return <span className="text-[11px] text-neutral-400 italic">Unassigned</span>;
    }

    const [first, ...rest] = assigned;

    return (
      <div className="flex flex-col min-w-0">
        <span
          className="font-medium text-neutral-900 dark:text-white truncate"
          title={assigned.map((t) => t.name).join(", ")}
        >
          {first.name}
        </span>
        {rest.length > 0 && (
          <span className="text-[10px] text-neutral-500">+{rest.length} more</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb at top left outside the card */}
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
          Courses
        </span>
      </nav>

      {/* Big Course List Card - Identical UI frame as Teachers Page */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Inside Card Header Bar */}
        <div className="p-4 sm:p-5 flex flex-col gap-5 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            {/* Back button inside the card */}
            <div className="flex items-center">
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

            {/* In the Center: Courses Heading with Refresh icon at its side */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                Courses
              </h2>
              <button
                type="button"
                disabled={isRefreshing || coursesLoading}
                onClick={handleRefresh}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Course Directory"
              >
                <RotateCcw
                  className={`w-4 h-4 ${isRefreshing || coursesLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Right: Green Pill Add Course button */}
            <div className="flex items-center">
              <Link
                href="/admin/courses/new"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </Link>
            </div>
          </div>

          {/* Search bar at right side & data above label at left side */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            {/* Left side: count data above label in normal text size */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                {filteredCourses.length}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Courses
              </span>
            </div>

            {/* Right side: Search bar, Category filter and Status filter */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Search course, tech, topics..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Select
                label="Filter by category"
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(0);
                }}
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "web", label: "Web & Full-Stack" },
                  { value: "ai", label: "AI & Data Science" },
                  { value: "devops", label: "DevOps & Cloud" },
                  { value: "database", label: "Database & Systems" },
                  { value: "elite", label: "Super10 Elite" },
                ]}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs whitespace-nowrap"
              />

              <Select
                label="Filter by status"
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(0);
                }}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active Only" },
                  { value: "inactive", label: "Inactive" },
                ]}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs whitespace-nowrap"
              />
            </div>
          </div>
        </div>

        {/* Table - Retains ALL columns with identical Teachers page UI */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Courses</th>
                <th className="py-3 px-4 sm:px-6">Category</th>
                <th className="py-3 px-4 sm:px-6">Teacher</th>
                <th className="py-3 px-4 sm:px-6">Tech Stack</th>
                <th className="py-3 px-4 sm:px-6">Duration & Fee</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {coursesLoading || studentsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-neutral-400 animate-pulse">
                    Loading course catalogue...
                  </td>
                </tr>
              ) : pagedCourses.length > 0 ? (
                pagedCourses.map((course) => {
                  const isInactive = (course.status ?? "active") === "inactive";

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Course Title */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {course.title}
                        </span>
                      </td>

                      {/* Category - Plain text without rounded card */}
                      <td className="py-3.5 px-4 sm:px-6 text-neutral-700 dark:text-neutral-300 font-medium">
                        {course.categoryLabel || course.category}
                      </td>

                      {/* Teacher */}
                      <td className="py-3.5 px-4 sm:px-6">
                        {renderTeacherCell(course)}
                      </td>

                      {/* Tech Stack */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {stackDisplay(course) === "icons"
                            ? course.techIcons.slice(0, 4).map((icon) => (
                                <div
                                  key={icon}
                                  className="p-1 rounded-md bg-neutral-100 dark:bg-white/5"
                                  title={icon}
                                >
                                  <DevIcon name={icon} size={14} />
                                </div>
                              ))
                            : course.techStack.slice(0, 4).map((tech) => (
                                <span
                                  key={tech}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400"
                                >
                                  {tech}
                                </span>
                              ))}
                          {course.techStack.length > 4 && (
                            <span className="text-[10px] text-neutral-400">
                              +{course.techStack.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration & Fee */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {course.fee}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {course.duration}
                          </span>
                        </div>
                      </td>

                      {/* Status - Plain text with indicator without rounded card */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(course)}
                          className="inline-flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          title={`Click to ${isInactive ? "activate" : "deactivate"} course`}
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

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Course Link - Blue */}
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="p-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="View Course"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit Course Link - Orange */}
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="p-1.5 rounded-lg text-white bg-orange-500 hover:bg-orange-600 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Edit Course"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>

                          {/* Delete Course with Confirmation - Red */}
                          {deleteConfirmId === course.id ? (
                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteCourse(course.id)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded cursor-pointer disabled:opacity-50"
                                title="Delete course"
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
                              onClick={() => setDeleteConfirmId(course.id)}
                              className="p-1.5 rounded-lg text-white bg-red-600 hover:bg-red-500 shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center"
                              title="Delete Course"
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
                  <td colSpan={7} className="text-center py-10 text-neutral-400">
                    {firestoreCourses.length === 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-xs">No courses registered yet.</p>
                        <Link
                          href="/admin/courses/new"
                          className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                        >
                          Add Your First Course
                        </Link>
                      </div>
                    ) : searchQuery.trim() ? (
                      "No courses match your search query."
                    ) : (
                      "No courses found in this category or status."
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
          total={filteredCourses.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(0);
          }}
          noun="courses"
        />
      </div>
    </div>
  );
}
