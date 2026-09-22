"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { DevIcon } from "@/components/ui/dev-icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AdminPage } from "@/components/admin/admin-page";
import { Field } from "@/components/admin/detail-field";
import { isPublic } from "@/lib/courses-server";
import { stackDisplay } from "@/data/courses";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface AdminCourseDetailProps {
  courseId: string;
  /** The shell's chrome, so this page can drive the sidebar and go back to the tab list. */
  shell: AdminShellState;
}

/**
 * One course, read-only, with the two things an admin came here to do.
 *
 * It reads `firestoreCourses` rather than `courses`: that is the raw admin subscription, with no
 * status filter, so a course an admin has retired still has a page — which is exactly the one
 * worth looking at before relisting it. `getPublicCourses`/`isPublic` hide those and would render
 * "No such course" for a course that plainly exists on the tab.
 *
 * Edit is a link to the course's editor page rather than a modal: the form is a piece of work,
 * so it gets a URL. The save goes through the provider, whose subscription this page is already
 * reading, so the view redraws with the new values — no refetch, and no second copy to keep in
 * step.
 */
export function AdminCourseDetail({ courseId, shell }: AdminCourseDetailProps) {
  const { firestoreCourses, loading, removeCourse } = useCourses();
  const { students } = useStudents();
  const { showToast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const course = firestoreCourses.find((c) => c.id === courseId);

  // By id rather than a filter per id: `teacherIds` is a lookup list, and the roster is small.
  // Unresolved ids are kept and rendered as the id — a teacher whose account the roster has not
  // handed over yet is still assigned, and saying "Unassigned" would be a lie.
  const teacherById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const goToCourses = () => shell.onNavigateTab("courses");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeCourse(courseId);
      showToast("Course deleted successfully", "success");
      // The document is gone from the subscription, so this page has nothing left to show.
      goToCourses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      showToast(msg, "error");
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const chrome = (children: React.ReactNode) => (
    <AdminPage shell={shell}>{children}</AdminPage>
  );

  const crumbs = (
    <PageHeader
      crumbs={[
        { label: "Home", onSelect: () => shell.onNavigateTab("home") },
        { label: "Courses", onSelect: goToCourses },
        { label: course?.title || "Course" },
      ]}
      action={
        course ? (
          isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-1 text-[10px] text-neutral-500 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )
        ) : undefined
      }
    />
  );

  // `loading` first, or "No such course" flashes on every load: the subscription resolves a
  // commit after mount, so a found course is missing for one frame.
  if (loading) {
    return chrome(
      <>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading course...
        </div>
      </>
    );
  }

  if (!course) {
    return chrome(
      <>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No course with this id. It may have been deleted, or the link may be wrong.
          </p>
          <button
            type="button"
            onClick={goToCourses}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Courses
          </button>
        </div>
      </>
    );
  }

  const active = isPublic(course);

  return (
    <>
      {chrome(
        <>
          {crumbs}

          {/* One card, not one per section. The fields are all the same kind of thing, and six
              boxed panels made a page this short read as six pages; the grid is the grouping
              instead. Four entries to a row, and the long ones — the title, the description, the
              topic list, the chat prompt — take the columns their content needs rather than
              wrapping inside a quarter width. */}
          <section className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-5 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                #{course.number}
              </span>
              <h1 className="text-base font-bold text-neutral-900 dark:text-white">
                {course.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  active
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10"
                }`}
              >
                {active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
              <Field label="Title" className="col-span-2">
                {course.title}
              </Field>
              <Field label="Banner title" className="col-span-2">
                {course.bannerTitle || "—"}
              </Field>
              <Field label="Banner subtitle">{course.bannerSubtitle || "—"}</Field>
              <Field label="Badge">{course.badge || "—"}</Field>
              <Field label="Badge type">{course.badgeType || "—"}</Field>
              <Field label="Enrollment id">{course.enrollmentId || "—"}</Field>
              <Field label="Category">{course.categoryLabel || course.category}</Field>
              <Field label="Fee">
                {course.fee} ({`₹${course.amount}`})
              </Field>
              <Field label="Duration">{course.duration}</Field>
              <Field label="Level">{course.level}</Field>

              <Field label="Description" className="col-span-2">
                <p className="leading-relaxed whitespace-pre-wrap">{course.description || "—"}</p>
              </Field>

              {/* One or the other, never both: a logo beside its own name is the same fact twice,
                  and the row of names under a row of marks was the page's tallest and emptiest
                  block. Which one is `stackDisplay`'s call, so the tab agrees with this page. */}
              <Field label="Tech stack" className="col-span-2">
                {course.techStack.length === 0 ? (
                  <span className="text-neutral-400">None listed</span>
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
                        className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Topics" className="col-span-2">
                {course.topics.length === 0 ? (
                  <span className="text-neutral-400">None listed</span>
                ) : (
                  <ol className="flex flex-col gap-2 list-none">
                    {course.topics.map((topic, index) => (
                      <li key={topic} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-neutral-100 dark:bg-white/5 text-[9px] font-bold text-neutral-500 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Field>

              <Field label="Assigned teachers" className="col-span-2">
                {(course.teacherIds ?? []).length === 0 ? (
                  <span className="text-neutral-400">Unassigned</span>
                ) : (
                  // Side by side rather than stacked: a course has a few teachers, and this is a
                  // page to be read, not scrolled. Each chip opens that account's own page — but
                  // only where the roster holds the account, because a link to an id nobody holds
                  // is a link to a page that can only answer "no such account".
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(course.teacherIds ?? []).map((id) => {
                      const teacher = teacherById.get(id);

                      const chip = (
                        <>
                          <UserAvatar user={teacher ?? {}} size="sm" />
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                            {teacher?.name || id}
                          </span>
                        </>
                      );

                      return teacher ? (
                        <Link
                          key={id}
                          href={`/admin/teachers/${id}`}
                          title={teacher.email}
                          className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors max-w-[14rem]"
                        >
                          {chip}
                        </Link>
                      ) : (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 max-w-[14rem]"
                        >
                          {chip}
                        </span>
                      );
                    })}
                  </div>
                )}
              </Field>

              <Field label="Chat prompt" className="col-span-2 sm:col-span-4">
                <p className="leading-relaxed">{course.actionPrompt || "—"}</p>
              </Field>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default AdminCourseDetail;
