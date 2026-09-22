"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check } from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { StatusSwitch } from "@/components/ui/switch";
import { iconKeyFor, DevIcon } from "@/components/ui/dev-icon";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPage } from "@/components/admin/admin-page";
import {
  CourseItem,
  CourseStatus,
  COURSE_BADGES,
  COURSE_DURATIONS,
  COURSE_LEVELS,
  TECH_STACK_OPTIONS,
} from "@/data/courses";
import type { AdminShellState } from "@/components/admin/admin-shell";

interface CourseEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating a course, which is the only difference between the two routes. */
  courseId?: string;
}

/**
 * The course form, as a page: `/admin/courses/new` and `/admin/courses/[id]/edit`.
 *
 * A page rather than a modal, because creating or editing a course is a piece of work — a long
 * description, a topic list, half a dozen short fields — and that is worth a URL: it can be
 * refreshed without losing the screen, opened in a tab, and left with the browser's own back
 * button.
 *
 * Only what an admin actually decides is asked for. The id and the display number are the
 * title's, the icons are the tech stack's, and the fee's digits are the amount — all derived on
 * save, and shown read-only where they matter.
 *
 * This half only resolves the course and gets out of the way: `CourseForm` below owns the fields,
 * and it is mounted only once the course is here. That ordering is the point. Every field is
 * seeded in its own state initialiser, which runs once, at mount — and `firestoreCourses` is an
 * empty array until the subscription answers, so a form mounted on the first render would seed
 * itself from nothing and then never re-read. Keying on the course is what makes the initialisers
 * correct rather than merely the first field's worth of data.
 */
export function CourseEditorPage({ courseId, shell }: CourseEditorPageProps) {
  const { firestoreCourses: courses, loading } = useCourses();

  const course = courseId ? courses.find((c) => c.id === courseId) : null;

  // `loading` first, or "No such course" flashes while the subscription is still answering.
  if (courseId && loading) {
    return (
      <AdminPage shell={shell}>
        <EditorCrumbs shell={shell} title={null} />
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading course...
        </div>
      </AdminPage>
    );
  }

  if (courseId && !course) {
    return (
      <AdminPage shell={shell}>
        <EditorCrumbs shell={shell} title={null} />
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

  return <CourseForm key={course?.id ?? "new"} course={course ?? null} shell={shell} />;
}

function EditorCrumbs({ shell, title }: { shell: AdminShellState; title: string | null }) {
  return (
    <PageHeader
      crumbs={[
        { label: "Home", onSelect: () => shell.onNavigateTab("home") },
        { label: "Courses", onSelect: () => shell.onNavigateTab("courses") },
        { label: title ? `Edit ${title}` : "New Course" },
      ]}
    />
  );
}

/**
 * The form itself. `course` is null for a new one, and non-null for every field that reads from
 * it — the parent does not mount this until that is settled.
 */
function CourseForm({ course, shell }: { course: CourseItem | null; shell: AdminShellState }) {
  const { showToast } = useToast();
  const { addCourse, editCourse } = useCourses();
  const { students } = useStudents();
  const router = useRouter();

  // The people a course can be assigned to: the accounts an admin has marked as faculty.
  const faculty = useMemo(() => students.filter((s) => s.is_teacher), [students]);

  // The vocabulary, plus whatever this course already holds. Without the second half, a name
  // saved before the picker existed — "Next.js 15" carries a version the vocabulary does not, and
  // the referral programme's stack is prose rather than technologies — would still be on the
  // course but not in the list, so the closed trigger could show it and the popup could not.
  const techStackOptions = useMemo(() => {
    const known = new Set<string>(TECH_STACK_OPTIONS);
    const extra = (course?.techStack ?? []).filter((tech) => !known.has(tech));
    return [...TECH_STACK_OPTIONS, ...extra];
  }, [course]);

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
  const [formTechStack, setFormTechStack] = useState<string[]>(() =>
    course
      ? course.techStack || []
      : ["Next.js", "React", "FastAPI", "Python", "PostgreSQL"]
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
      const techStackArr = formTechStack;

      // Derived, not picked: a stack name the icon map knows gets its mark, and one it does not
      // (RAG, say) contributes nothing rather than a wrong brand.
      const techIconsArr = techStackArr
        .map(iconKeyFor)
        .filter((key): key is string => key !== null);

      const topicsArr = formTopics
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      // The one fee box is the display string; the number the catalogue filters on is whatever
      // digits it holds. "₹30,000" is 30000, and a word with no digits in it is 0 — which is
      // also what the public catalogue reads as "sponsored".
      const amount = Number(formFee.replace(/[^0-9]/g, "")) || 0;

      if (course) {
        await editCourse(course.id, {
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
          amount,
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
        // No id and no number in the payload: the provider slugs the title and defaults the
        // number to the next in the list, so both are derived rather than typed.
        const created = await addCourse({
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
          amount,
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

  return (
    <AdminPage shell={shell}>
      <EditorCrumbs shell={shell} title={course?.title ?? null} />

      <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-5 sm:p-6 flex flex-col gap-5 text-neutral-900 dark:text-white">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className="text-sm sm:text-base font-bold">
            {course ? "Edit Course" : "Create New Course"}
          </h2>
          {/* Both are derived from the title now, so they are shown rather than typed. Read-only
              even here: the id is the Firestore document key and the URL, and moving it would
              break every link to the course. */}
          {course && (
            <span className="ml-auto font-mono text-[10px] text-neutral-400">
              /courses/{course.id} · #{course.number}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCourse} className="flex flex-col gap-4 text-xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Badge Text */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Badge Text (Optional)
              </label>
              <Combobox
                label="Badge text"
                options={COURSE_BADGES}
                value={formBadge}
                onValueChange={setFormBadge}
                placeholder="e.g. Bestseller"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Duration
              </label>
              <Combobox
                label="Duration"
                options={COURSE_DURATIONS}
                value={formDuration}
                onValueChange={setFormDuration}
                placeholder="60 Days (2 Months)"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">Level</label>
              <Combobox
                label="Level"
                options={COURSE_LEVELS}
                value={formLevel}
                onValueChange={setFormLevel}
                placeholder="Beginner to Adv"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Fee */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">Fee</label>
              <input
                type="text"
                value={formFee}
                onChange={(e) => setFormFee(e.target.value)}
                placeholder="₹30,000"
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-semibold"
              />
              <span className="text-[10px] text-neutral-400">
                Shown in the catalogue as typed; the number inside it is the amount.
              </span>
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

          {/* Stack, Visibility & Faculty. The status is how a course leaves the public site:
              the catalogue, sitemap and /llms.txt all read through getPublicCourses,
              which drops anything inactive, and /courses/<slug> then 404s. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                Tech Stack
              </label>
              {/* Picked, not typed. A freehand list is where "TailwindCSS", "Tailwind CSS" and
                  "tailwind" become three technologies with one logo between them, and where a
                  name the icon map was never taught draws initials instead of a brand. */}
              <Select
                multiple
                label="Tech stack"
                value={formTechStack}
                onValueChange={setFormTechStack}
                options={techStackOptions.map((tech) => ({
                  value: tech,
                  label: tech,
                  icon: <DevIcon name={tech} size={14} />,
                }))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
              />
              <span className="text-[10px] text-neutral-400">
                Each name also picks its own logo.
              </span>
            </div>

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
                course
                  ? router.push(`/admin/courses/${course.id}`)
                  : shell.onNavigateTab("courses")
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
