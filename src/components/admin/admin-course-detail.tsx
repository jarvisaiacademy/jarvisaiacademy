"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft, Pencil, Trash2, BookOpen } from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { DevIcon } from "@/components/ui/dev-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AdminPage } from "@/components/admin/admin-page";
import { isPublic } from "@/lib/courses-server";
import { stackDisplay } from "@/data/courses";
import { useAuth } from "@/providers/auth-provider";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface AdminCourseDetailProps {
  courseId: string;
  /** The shell's chrome, so this page can drive the sidebar and go back to the tab list. */
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
    hour12: true,
  });
}

export function AdminCourseDetail({ courseId, shell }: AdminCourseDetailProps) {
  const router = useRouter();
  const { firestoreCourses, loading, removeCourse } = useCourses();
  const { students } = useStudents();
  const { showToast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const course = firestoreCourses.find((c) => c.id === courseId);

  const { user } = useAuth();

  // By id rather than a filter per id: teacher lookup map
  const teacherById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

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

  const createdAuthorName = resolveAuthorName(course?.createdBy);
  const updatedAuthorName = resolveAuthorName(course?.updatedBy || course?.createdBy);

  const goToCourses = () => {
    shell.onNavigateTab("courses");
    router.push("/admin");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeCourse(courseId);
      showToast("Course deleted successfully", "success");
      goToCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      showToast(msg, "error");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
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
        onClick={goToCourses}
        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
      >
        Courses
      </button>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
      <span className="font-semibold text-neutral-900 dark:text-white">
        Course Details
      </span>
    </nav>
  );

  // Loading state
  if (loading || (firestoreCourses.length === 0 && !course)) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-10 text-center text-xs text-neutral-400 animate-pulse">
            Loading course details...
          </div>
        </div>
      </AdminPage>
    );
  }

  // Not found state
  if (!course) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
          {breadcrumbNav}
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No course found with this ID. It may have been deleted or the link is incorrect.
            </p>
            <button
              type="button"
              onClick={goToCourses}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  const active = isPublic(course);

  return (
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
        {breadcrumbNav}

        {/* Big Card matching View Teacher layout */}
        <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
          {/* Card Header: Back button on left, centered Heading Course Details, Edit & Delete on right */}
          <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
            <div className="relative flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 min-h-[38px]">
              {/* Left: Back button */}
              <div className="flex items-center z-10">
                <button
                  type="button"
                  onClick={goToCourses}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                  title="Back to Courses"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Center: Heading Course Details */}
              <div className="w-full sm:w-auto sm:absolute sm:inset-0 flex items-center justify-center pointer-events-none order-first sm:order-none">
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center pointer-events-auto">
                  Course Details
                </h1>
              </div>

              {/* Top Right: Delete (Red) + Edit Course (Orange) */}
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
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors cursor-pointer"
                  title="Edit Course"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Course</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-7 flex flex-col gap-6">
            {/* Identity Bar (No card wrapper, matching Teacher Detail) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-neutral-900 dark:text-white truncate">
                    {course.title}
                  </span>
                  <span className="text-xs text-neutral-500 truncate">
                    {course.categoryLabel || course.category} · {course.fee} · {course.duration}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    active
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      active ? "bg-emerald-500" : "bg-neutral-400"
                    }`}
                  />
                  <span>{active ? "Active" : "Inactive"}</span>
                </span>
              </div>
            </div>

            {/* 4-GRID (Data on Top, Label Below — No insider card boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Title */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.title}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Course Title
                </span>
              </div>

              {/* 2. Banner Title */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.bannerTitle || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Short Banner Title
                </span>
              </div>

              {/* 3. Banner Subtitle */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.bannerSubtitle || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Banner Subtitle
                </span>
              </div>

              {/* 4. Category */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.categoryLabel || course.category}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Category
                </span>
              </div>

              {/* 5. Fee */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.fee} (₹{course.amount.toLocaleString("en-IN")})
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Fee & Amount
                </span>
              </div>

              {/* 6. Duration */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                  {course.duration}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Duration
                </span>
              </div>

              {/* 7. Status */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">
                  {course.status ?? "active"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Status
                </span>
              </div>

              {/* 8. Assigned Teachers */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-2">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {(course.teacherIds ?? []).length} {((course.teacherIds ?? []).length === 1 ? "Teacher" : "Teachers")}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Assigned Faculty
                </span>
              </div>

              {/* Assigned Teacher Badges/Chips */}
              {(course.teacherIds ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4 -mt-2">
                  {(course.teacherIds ?? []).map((id) => {
                    const teacher = teacherById.get(id);
                    return teacher ? (
                      <Link
                        key={id}
                        href={`/admin/teachers/${id}`}
                        title={teacher.email}
                        className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <UserAvatar user={teacher} size="sm" />
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {teacher.name || id}
                        </span>
                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-500"
                      >
                        {id}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 13. Tech Stack */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                {course.techStack.length === 0 ? (
                  <span className="text-sm font-semibold text-neutral-400">None listed</span>
                ) : stackDisplay(course) === "icons" ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {course.techIcons.map((icon) => (
                      <span
                        key={icon}
                        title={icon}
                        className="p-1.5 rounded-md bg-neutral-100 dark:bg-white/5"
                      >
                        <DevIcon name={icon} size={16} />
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {course.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Tech Stack
                </span>
              </div>

              {/* 14. Course Description */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-normal text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {course.description || "No description provided."}
                </p>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Course Description
                </span>
              </div>

              {/* 15. Curriculum Highlights */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                {course.topics.length === 0 ? (
                  <span className="text-sm font-semibold text-neutral-400">None listed</span>
                ) : (
                  <ol className="flex flex-col gap-2 list-none">
                    {course.topics.map((topic, index) => (
                      <li key={topic} className="flex items-start gap-2 text-sm text-neutral-800 dark:text-neutral-200">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-neutral-100 dark:bg-white/5 text-[9px] font-bold text-neutral-500 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Curriculum Highlights
                </span>
              </div>

              {/* 16. Chat Prompt */}
              <div className="flex flex-col min-w-0 col-span-1 sm:col-span-2 lg:col-span-4">
                <p className="text-sm font-mono text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {course.actionPrompt || "—"}
                </p>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  AI Chat Inquiry Prompt
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
                {formatWhen(course.createdAt)}
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
                {formatWhen(course.updatedAt || course.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

export default AdminCourseDetail;
