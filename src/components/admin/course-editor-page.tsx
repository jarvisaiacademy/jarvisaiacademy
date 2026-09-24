"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Pencil,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { iconKeyFor, DevIcon } from "@/components/ui/dev-icon";
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
 */
export function CourseEditorPage({ courseId, shell }: CourseEditorPageProps) {
  const router = useRouter();
  const { firestoreCourses: courses, loading } = useCourses();

  const course = courseId ? courses.find((c) => c.id === courseId) : null;

  // `loading` first, or "No such course" flashes while the subscription is still answering.
  if (courseId && loading) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
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
              onClick={() => {
                shell.onNavigateTab("courses");
                router.push("/admin");
              }}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Courses
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-900 dark:text-white">
              Loading...
            </span>
          </nav>
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
            Loading course...
          </div>
        </div>
      </AdminPage>
    );
  }

  if (courseId && !course) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
        <div className="flex flex-col gap-4">
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
              onClick={() => {
                shell.onNavigateTab("courses");
                router.push("/admin");
              }}
              className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Courses
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-900 dark:text-white">
              Not Found
            </span>
          </nav>
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              No course with this id, so there is nothing to edit. It may have been deleted.
            </p>
            <button
              type="button"
              onClick={() => {
                shell.onNavigateTab("courses");
                router.push("/admin");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  return <CourseForm key={course?.id ?? "new"} course={course ?? null} shell={shell} />;
}

/**
 * The form itself. `course` is null for a new one, and non-null for every field that reads from it.
 */
function CourseForm({ course, shell }: { course: CourseItem | null; shell: AdminShellState }) {
  const { showToast } = useToast();
  const { addCourse, editCourse } = useCourses();
  const { students } = useStudents();
  const router = useRouter();

  // The people a course can be assigned to: accounts marked as faculty
  const faculty = useMemo(() => students.filter((s) => s.is_teacher), [students]);

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

  const actionPrompt =
    course?.actionPrompt || (course ? `Tell me about the ${course.title} course` : "");
  const [formStatus, setFormStatus] = useState<CourseStatus>(() => course?.status ?? "active");
  const [formTeacherIds, setFormTeacherIds] = useState<string[]>(() => course?.teacherIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const handleCancel = () => {
    if (course) {
      router.push(`/admin/courses/${course.id}`);
    } else {
      shell.onNavigateTab("courses");
      router.push("/admin");
    }
  };

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

      const techIconsArr = techStackArr
        .map(iconKeyFor)
        .filter((key): key is string => key !== null);

      const topicsArr = formTopics
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

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
        router.push(`/admin/courses/${course.id}`);
      } else {
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
    <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
      <div className="flex flex-col gap-4">
        {/* Breadcrumb at the left side at top outside the card */}
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
            onClick={() => {
              shell.onNavigateTab("courses");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Courses
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {course ? `Edit ${course.title}` : "Add Course"}
          </span>
        </nav>

        {/* Big Card containing form */}
        <form onSubmit={handleSaveCourse} className="w-full pb-16">
          <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
            {/* Header: Back button on left, centered Heading */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                {/* Back button inside the card */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                    title="Back to Courses"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                {/* Center: Heading Add New Course / Edit Course */}
                <div className="flex items-center justify-center">
                  <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center">
                    {course ? "Edit Course" : "Add New Course"}
                  </h1>
                </div>

                {/* Right spacer for centering */}
                <div className="flex items-center justify-end min-w-[72px]">
                  {course ? (
                    <span className="font-mono text-[11px] font-bold text-neutral-400">
                      #{course.number}
                    </span>
                  ) : (
                    <div className="w-[72px] invisible" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* 4-GRID layout matching Teacher Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Course Title (spans full 4 cols on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Autonomous AI Agents & LangGraph"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* 2. Short Banner Title */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Short Banner Title
                  </label>
                  <input
                    type="text"
                    value={formBannerTitle}
                    onChange={(e) => setFormBannerTitle(e.target.value)}
                    placeholder="e.g. AI Agents & LangGraph"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Banner Subtitle */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Banner Subtitle
                  </label>
                  <input
                    type="text"
                    value={formBannerSubtitle}
                    onChange={(e) => setFormBannerSubtitle(e.target.value)}
                    placeholder="e.g. Multi-Agent Systems · RAG · Python"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Badge Text (Optional) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Badge Text (Optional)
                  </label>
                  <Combobox
                    label="Badge text"
                    options={COURSE_BADGES}
                    value={formBadge}
                    onValueChange={setFormBadge}
                    placeholder="e.g. Bestseller"
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 5. Badge Style */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
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
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 6. Category */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Category <span className="text-red-500">*</span>
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
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 7. Duration */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Duration
                  </label>
                  <Combobox
                    label="Duration"
                    options={COURSE_DURATIONS}
                    value={formDuration}
                    onValueChange={setFormDuration}
                    placeholder="60 Days (2 Months)"
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 8. Level */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Level
                  </label>
                  <Combobox
                    label="Level"
                    options={COURSE_LEVELS}
                    value={formLevel}
                    onValueChange={setFormLevel}
                    placeholder="Beginner to Adv"
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 9. Fee */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Fee
                  </label>
                  <input
                    type="text"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    placeholder="₹30,000"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-semibold placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Shown in catalogue as typed; digits determine the amount.
                  </span>
                </div>

                {/* 10. Status */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Course Status
                  </label>
                  <Select
                    label="Course Status"
                    value={formStatus}
                    onValueChange={(val) => setFormStatus(val as CourseStatus)}
                    options={[
                      { value: "active", label: "Active (Listed Publicly)" },
                      { value: "inactive", label: "Inactive (Hidden)" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Active lists it publicly; inactive hides it from catalogue and search.
                  </span>
                </div>

                {/* 11. Assigned Teachers (spans 1 col on sm, 1 col on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Assigned Teachers
                  </label>
                  <Select
                    multiple
                    label="Assigned teachers"
                    value={formTeacherIds}
                    onValueChange={setFormTeacherIds}
                    options={faculty.map((t) => ({ value: t.id, label: t.name }))}
                    formatValue={(ids) => {
                      const list = ids as string[];
                      if (list.length === 0) return "No teachers";
                      if (list.length === 1) {
                        const found = faculty.find((t) => t.id === list[0]);
                        return found?.name || list[0];
                      }
                      return `${list.length} teachers`;
                    }}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {faculty.length === 0
                      ? "No faculty yet — mark an account as Teacher."
                      : formTeacherIds.length === 0
                        ? "No teacher assigned yet."
                        : formTeacherIds
                            .map((id) => faculty.find((t) => t.id === id)?.name ?? id)
                            .join(", ")}
                  </span>
                </div>

                {/* 12. Tech Stack (spans 2 cols on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Tech Stack
                  </label>
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
                    formatValue={(val) => {
                      const list = val as string[];
                      if (list.length === 0) return "No tech selected";
                      if (list.length === 1) return list[0];
                      return `${list.length} technologies`;
                    }}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                  <span className="text-[10px] text-neutral-400">
                    Each name automatically assigns its brand icon.
                  </span>
                  {formTechStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTechStack.map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                        >
                          <DevIcon name={tech} size={12} />
                          <span>{tech}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 13. Course Description (spans all 4 columns) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Course Description
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Summary of what candidates will build and master..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-y"
                  />
                </div>

                {/* 14. Curriculum Topics (spans all 4 columns) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Curriculum Highlights (One topic per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formTopics}
                    onChange={(e) => setFormTopics(e.target.value)}
                    placeholder={"Next.js 15 Server Components & Actions\nFastAPI Async Microservices\nPostgreSQL & Schema Optimization"}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-[11px] resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Cancel on left with cancel icon, Save/Add Course pill button on right */}
            <div className="px-5 sm:px-7 py-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/[0.02]">
              {/* Bottom Left: Cancel button with cancel icon */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              {/* Bottom Right: Add / Save Course pill button */}
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : course ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{course ? "Save Changes" : "Add Course"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}

export default CourseEditorPage;
