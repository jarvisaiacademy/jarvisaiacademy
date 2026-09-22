"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check } from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { StatusSwitch } from "@/components/ui/switch";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPage } from "@/components/admin/admin-page";
import { CourseItem, CourseStatus } from "@/data/courses";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface CourseEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating a course, which is the only difference between the two routes. */
  courseId?: string;
}

/**
 * The course form, as a page: `/admin/courses/new` and `/admin/courses/[id]/edit`.
 *
 * A page rather than a modal, because creating or editing a course is a piece of work — twenty
 * fields, a long description, topics — and that is worth a URL: it can be refreshed without
 * losing the screen, opened in a tab, and left with the browser's own back button.
 *
 * Each field is seeded from `course` in its own state initialiser, so a field's value and the
 * course it came from cannot drift apart. That is also why the route passes a `key` — the form
 * resets by being remounted, never by an effect: the course object is replaced on every Firestore
 * snapshot, so a form that re-seeded when it changed would wipe whatever an admin was typing.
 */
export function CourseEditorPage({ courseId, shell }: CourseEditorPageProps) {
  const { showToast } = useToast();
  const { firestoreCourses: courses, loading, addCourse, editCourse } = useCourses();
  const { students } = useStudents();
  const router = useRouter();

  // Named `course` because the whole form below is written against it: null is the create case.
  const course = courseId ? courses.find((c) => c.id === courseId) : null;

  // The people a course can be assigned to: the accounts an admin has marked as faculty.
  const faculty = useMemo(() => students.filter((s) => s.is_teacher), [students]);

  const [formId, setFormId] = useState(() => course?.id ?? "");
  const [formNumber, setFormNumber] = useState(
    () => course?.number ?? String(courses.length + 1).padStart(2, "0")
  );
  const [formTitle, setFormTitle] = useState(() => course?.title ?? "");
  const [formBannerTitle, setFormBannerTitle] = useState(
    () => course?.bannerTitle || course?.title || ""
  );
  const [formBannerSubtitle, setFormBannerSubtitle] = useState(
    () => course?.bannerSubtitle || ""
  );
  const [formDescription, setFormDescription] = useState(() => course?.description || "");
  const [formCategory, setFormCategory] = useState<CourseItem["category"]>(
    () => course?.category ?? "web"
  );
  const [formCategoryLabel, setFormCategoryLabel] = useState(
    () => course?.categoryLabel || (course ? "Specialized Program" : "Web & Full-Stack")
  );
  const [formBadge, setFormBadge] = useState(() => course?.badge || "");
  const [formBadgeType, setFormBadgeType] = useState<CourseItem["badgeType"] | "">(
    () => course?.badgeType || ""
  );
  const [formDuration, setFormDuration] = useState(
    () => course?.duration || (course ? "60 Days" : "60 Days (2 Months)")
  );
  const [formLevel, setFormLevel] = useState(() => course?.level || "Beginner to Adv");
  const [formFee, setFormFee] = useState(() => course?.fee || "₹30,000");
  const [formAmount, setFormAmount] = useState(() => course?.amount ?? 30000);
  const [formTechStack, setFormTechStack] = useState(() =>
    course
      ? (course.techStack || []).join(", ")
      : "Next.js, React, FastAPI, Python, PostgreSQL"
  );
  const [formTechIcons, setFormTechIcons] = useState(() =>
    course ? (course.techIcons || []).join(", ") : "nextjs, react, fastapi, python, postgresql"
  );
  const [formTopics, setFormTopics] = useState(() =>
    course
      ? (course.topics || []).join("\n")
      : "Module 1: Architecture\nModule 2: Real-time APIs\nModule 3: Cloud Deployment"
  );
  // The prompt the chat answers this course from. Derived rather than held in state: there has
  // never been an input for it, so it is seeded from the course and re-derived from the title on
  // save, and a setter nothing calls is just a field that looks editable and is not.
  const actionPrompt =
    course?.actionPrompt || (course ? `Tell me about the ${course.title} course` : "");
  const [formStatus, setFormStatus] = useState<CourseStatus>(() => course?.status ?? "active");
  const [formTeacherIds, setFormTeacherIds] = useState<string[]>(() => course?.teacherIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  // Save course (Add or Edit)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Course title is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const techStackArr = formTechStack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const techIconsArr = formTechIcons
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const topicsArr = formTopics
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (course) {
        await editCourse(course.id, {
          number: formNumber.trim() || course.number,
          title: formTitle.trim(),
          bannerTitle: formBannerTitle.trim() || formTitle.trim(),
          bannerSubtitle: formBannerSubtitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          categoryLabel: formCategoryLabel.trim(),
          badge: formBadge.trim() || undefined,
          badgeType: (formBadgeType as CourseItem["badgeType"]) || undefined,
          duration: formDuration.trim(),
          level: formLevel.trim(),
          fee: formFee.trim(),
          amount: Number(formAmount) || 0,
          techStack: techStackArr,
          techIcons: techIconsArr,
          topics: topicsArr,
          actionPrompt:
            actionPrompt.trim() || `Tell me about the ${formTitle.trim()} course`,
          status: formStatus,
          teacherIds: formTeacherIds,
        });
        showToast(`Course "${formTitle}" updated successfully!`, "success");
        // Straight to the course: this page's job is done, and the detail view is where the
        // saved values can be read back.
        router.push(`/admin/courses/${course.id}`);
      } else {
        const created = await addCourse({
          id: formId.trim() || undefined,
          number: formNumber.trim() || String(courses.length + 1).padStart(2, "0"),
          title: formTitle.trim(),
          bannerTitle: formBannerTitle.trim() || formTitle.trim(),
          bannerSubtitle: formBannerSubtitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          categoryLabel: formCategoryLabel.trim(),
          badge: formBadge.trim() || undefined,
          badgeType: (formBadgeType as CourseItem["badgeType"]) || undefined,
          duration: formDuration.trim(),
          level: formLevel.trim(),
          fee: formFee.trim(),
          amount: Number(formAmount) || 0,
          techStack: techStackArr,
          techIcons: techIconsArr,
          topics: topicsArr,
          actionPrompt:
            actionPrompt.trim() || `Tell me about the ${formTitle.trim()} course`,
          status: formStatus,
          teacherIds: formTeacherIds,
        });
        showToast(`New course "${formTitle}" created successfully!`, "success");
        router.push(`/admin/courses/${created.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save course";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const crumbs = (
    <PageHeader
      crumbs={[
        { label: "Home", onSelect: () => shell.onNavigateTab("home") },
        { label: "Courses", onSelect: () => shell.onNavigateTab("courses") },
        { label: course ? `Edit ${course.title}` : "New Course" },
      ]}
    />
  );

  // `loading` first, or "No such course" flashes while the subscription is still answering.
  if (courseId && loading) {
    return (
      <AdminPage shell={shell}>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading course...
        </div>
      </AdminPage>
    );
  }

  if (courseId && !course) {
    return (
      <AdminPage shell={shell}>
        {crumbs}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No course with this id, so there is nothing to edit. It may have been deleted.
          </p>
          <button
            type="button"
            onClick={() => shell.onNavigateTab("courses")}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Courses
          </button>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage shell={shell}>
      {crumbs}

      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-5 sm:p-6 flex flex-col gap-5 text-neutral-900 dark:text-white">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm sm:text-base font-bold">
            {course ? "Edit Course" : "Create New Course"}
          </h2>
        </div>

        <form onSubmit={handleSaveCourse} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Course ID / Slug */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Course Identifier (slug) *
              </label>
              <input
                type="text"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="e.g. genai-agents"
                disabled={!!course}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white disabled:opacity-60"
              />
              <span className="text-[10px] text-neutral-400">
                Unique key for routing &amp; Firestore document ID
              </span>
            </div>

            {/* Display Number */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Index / Number (#)
              </label>
              <input
                type="text"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder="e.g. 13"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-400">Used for catalog sorting</span>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Autonomous AI Agents & LangGraph"
              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Banner Title */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Short Banner Title
              </label>
              <input
                type="text"
                value={formBannerTitle}
                onChange={(e) => setFormBannerTitle(e.target.value)}
                placeholder="e.g. AI Agents & LangGraph"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Banner Subtitle */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Banner Subtitle
              </label>
              <input
                type="text"
                value={formBannerSubtitle}
                onChange={(e) => setFormBannerSubtitle(e.target.value)}
                placeholder="e.g. Multi-Agent Systems · RAG · Python"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Category *
              </label>
              <Select
                label="Category"
                value={formCategory}
                onValueChange={(value) => {
                  const cat = value as CourseItem["category"];
                  setFormCategory(cat);
                  if (cat === "web") setFormCategoryLabel("Web & Full-Stack");
                  else if (cat === "ai") setFormCategoryLabel("AI & Data Science");
                  else if (cat === "devops") setFormCategoryLabel("DevOps & Cloud");
                  else if (cat === "database") setFormCategoryLabel("Database & Systems");
                  else if (cat === "elite") setFormCategoryLabel("Super10 Elite");
                }}
                options={[
                  { value: "web", label: "Web & Full-Stack" },
                  { value: "ai", label: "AI & Data Science" },
                  { value: "devops", label: "DevOps & Cloud" },
                  { value: "database", label: "Database & Systems" },
                  { value: "elite", label: "Super10 Elite" },
                ]}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Category Label */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Category Label
              </label>
              <input
                type="text"
                value={formCategoryLabel}
                onChange={(e) => setFormCategoryLabel(e.target.value)}
                placeholder="e.g. AI & Data Science"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Duration
              </label>
              <input
                type="text"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="60 Days (2 Months)"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">Level</label>
              <input
                type="text"
                value={formLevel}
                onChange={(e) => setFormLevel(e.target.value)}
                placeholder="Beginner to Adv"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Fee */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Fee (Display &amp; Amount)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                  placeholder="₹30,000"
                  className="w-1/2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-semibold"
                />
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-1/2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Badge Text */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Badge Text (Optional)
              </label>
              <input
                type="text"
                value={formBadge}
                onChange={(e) => setFormBadge(e.target.value)}
                placeholder="e.g. Bestseller, 100% Placement"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Badge Type */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Badge Style
              </label>
              <Select
                label="Badge Style"
                value={formBadgeType ?? ""}
                onValueChange={(value) => setFormBadgeType(value as CourseItem["badgeType"] | "")}
                options={[
                  { value: "", label: "None" },
                  { value: "bestseller", label: "Bestseller (Cyan/Blue)" },
                  { value: "elite", label: "Elite (Gold/Amber)" },
                  { value: "popular", label: "Popular (Indigo/Purple)" },
                  { value: "ai", label: "AI Special (Violet/Magenta)" },
                ]}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Course Description
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Summary of what candidates will build and master..."
              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Tech Stack & Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Tech Stack (Comma-separated)
              </label>
              <input
                type="text"
                value={formTechStack}
                onChange={(e) => setFormTechStack(e.target.value)}
                placeholder="Next.js 15, React 19, FastAPI, PostgreSQL"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Tech Icons (DevIcon keys, comma-separated)
              </label>
              <input
                type="text"
                value={formTechIcons}
                onChange={(e) => setFormTechIcons(e.target.value)}
                placeholder="nextjs, react, fastapi, postgresql, python"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Curriculum Topics */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Curriculum Highlights (One topic per line)
            </label>
            <textarea
              rows={4}
              value={formTopics}
              onChange={(e) => setFormTopics(e.target.value)}
              placeholder="Next.js 15 Server Components & Actions&#10;FastAPI Async Microservices&#10;PostgreSQL & Schema Optimization"
              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          {/* Visibility & Faculty. The status is how a course leaves the public site:
              the catalogue, sitemap and /llms.txt all read through getPublicCourses,
              which drops anything inactive, and /courses/<slug> then 404s. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">Status</label>
              <StatusSwitch
                checked={formStatus === "active"}
                onCheckedChange={(next) => setFormStatus(next ? "active" : "inactive")}
                label="Course status"
              />
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Active lists it publicly; inactive hides it from the catalogue, the sitemap and
                /llms.txt, and its page 404s.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Assigned Teachers
              </label>
              <Select
                multiple
                label="Assigned teachers"
                value={formTeacherIds}
                onValueChange={setFormTeacherIds}
                options={faculty.map((t) => ({ value: t.id, label: t.name }))}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {faculty.length === 0
                  ? "No faculty yet — mark an account as Teacher on the Teachers tab."
                  : formTeacherIds.length === 0
                    ? "No teacher assigned to this course."
                    : formTeacherIds
                        .map((id) => faculty.find((t) => t.id === id)?.name ?? id)
                        .join(", ")}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
            <button
              type="button"
              // Back where the admin came from: a course being edited has a page to return to,
              // a new one does not, so that goes back to the tab list.
              onClick={() =>
                courseId ? router.push(`/admin/courses/${courseId}`) : shell.onNavigateTab("courses")
              }
              className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : course ? "Save Changes" : "Create Course"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}

export default CourseEditorPage;
