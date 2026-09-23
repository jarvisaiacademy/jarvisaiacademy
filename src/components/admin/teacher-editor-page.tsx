"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus, Briefcase, BookOpen, AlertCircle } from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPage } from "@/components/admin/admin-page";
import {
  createTeacherInFirestore,
  updateCandidateInFirestore,
} from "@/services/students-service";
import { syncTeacherCourseAssignments } from "@/services/courses-service";
import type { AdminShellState } from "@/components/admin/admin-shell";
import type { CandidateStatus, StudentRecord } from "@/data/students";

interface TeacherEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating a teacher */
  teacherId?: string;
}

export function TeacherEditorPage({ teacherId, shell }: TeacherEditorPageProps) {
  const { students, loading: studentsLoading } = useStudents();
  const { firestoreCourses: courses, loading: coursesLoading } = useCourses();

  const teacher = teacherId ? students.find((s) => s.id === teacherId) : null;

  // Waiting on the roster subscription
  if (teacherId && studentsLoading) {
    return (
      <AdminPage shell={shell}>
        <PageHeader
          crumbs={[
            { label: "Home", onSelect: () => shell.onNavigateTab("home") },
            { label: "Teachers", onSelect: () => shell.onNavigateTab("teachers") },
            { label: "Loading..." },
          ]}
        />
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading teacher details...
        </div>
      </AdminPage>
    );
  }

  if (teacherId && !teacher) {
    return (
      <AdminPage shell={shell}>
        <PageHeader
          crumbs={[
            { label: "Home", onSelect: () => shell.onNavigateTab("home") },
            { label: "Teachers", onSelect: () => shell.onNavigateTab("teachers") },
            { label: "Not Found" },
          ]}
        />
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No teacher account with this id. It may have been removed or the link is incorrect.
          </p>
          <button
            type="button"
            onClick={() => shell.onNavigateTab("teachers")}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Teachers
          </button>
        </div>
      </AdminPage>
    );
  }

  return (
    <TeacherForm
      key={teacher?.id ?? "new"}
      teacher={teacher ?? null}
      shell={shell}
      coursesLoading={coursesLoading}
    />
  );
}

interface TeacherFormProps {
  teacher: StudentRecord | null;
  shell: AdminShellState;
  coursesLoading: boolean;
}

function TeacherForm({ teacher, shell, coursesLoading }: TeacherFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { students } = useStudents();
  const { firestoreCourses: courses } = useCourses();

  // Mode: "manual" (enter new details) or "promote" (select an existing student)
  const [createMode, setCreateMode] = useState<"manual" | "promote">("manual");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Filter non-teacher students for promote option
  const nonTeacherStudents = useMemo(
    () => students.filter((s) => !s.is_teacher && s.role !== "admin"),
    [students]
  );

  // Initial assigned courses for this teacher
  const initialCourseIds = useMemo(() => {
    if (!teacher) return [];
    return courses
      .filter((c) => (c.teacherIds ?? []).includes(teacher.id))
      .map((c) => c.id);
  }, [courses, teacher]);

  const [name, setName] = useState(() => teacher?.name ?? "");
  const [email, setEmail] = useState(() => teacher?.email ?? "");
  const [title, setTitle] = useState(() => teacher?.title ?? "");
  const [specialization, setSpecialization] = useState(() => teacher?.specialization ?? "");
  const [phone, setPhone] = useState(() => teacher?.phone ?? "");
  const [bio, setBio] = useState(() => teacher?.bio ?? "");
  const [status, setStatus] = useState<CandidateStatus>(() => teacher?.status ?? "active");
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>(initialCourseIds);
  const [isSaving, setIsSaving] = useState(false);

  // When a student is picked in promote mode, pre-fill their name & email
  const handleSelectStudentToPromote = (studentId: string) => {
    setSelectedStudentId(studentId);
    const found = nonTeacherStudents.find((s) => s.id === studentId);
    if (found) {
      setName(found.name || "");
      setEmail(found.email || "");
      if (found.phone) setPhone(found.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Teacher name is required", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showToast("A valid email address is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      let savedTeacherId = teacher?.id;

      if (teacher) {
        // UPDATE existing teacher
        await updateCandidateInFirestore(
          teacher.id,
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
            is_teacher: true,
          },
          user?.email
        );
      } else {
        // CREATE new teacher or PROMOTE existing account
        savedTeacherId = await createTeacherInFirestore(
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
            existingUserId: createMode === "promote" && selectedStudentId ? selectedStudentId : undefined,
          },
          user?.email
        );
      }

      // Synchronize course assignments
      if (savedTeacherId) {
        await syncTeacherCourseAssignments(savedTeacherId, assignedCourseIds, user?.email);
      }

      showToast(
        teacher
          ? `Teacher "${name}" updated successfully`
          : `Teacher "${name}" created successfully`,
        "success"
      );

      if (teacher) {
        router.push(`/admin/teachers/${teacher.id}`);
      } else {
        shell.onNavigateTab("teachers");
        router.push("/admin");
      }
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to save teacher",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const crumbs = [
    { label: "Home", onSelect: () => shell.onNavigateTab("home") },
    { label: "Teachers", onSelect: () => shell.onNavigateTab("teachers") },
    { label: teacher ? `Edit ${teacher.name || "Teacher"}` : "New Teacher" },
  ];

  return (
    <AdminPage shell={shell}>
      <PageHeader crumbs={crumbs} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-4xl pb-16">
        {/* Creator Mode Selector (Only on New Teacher) */}
        {!teacher && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                Teacher Source
              </span>
              <span className="text-[11px] text-neutral-500">
                Create a faculty profile directly or promote an existing registered learner.
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setCreateMode("manual")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  createMode === "manual"
                    ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateMode("promote")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  createMode === "promote"
                    ? "bg-white dark:bg-white/15 text-neutral-900 dark:text-white shadow-xs"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Promote Registered User</span>
              </button>
            </div>
          </div>
        )}

        {/* Existing Learner Picker (in Promote mode) */}
        {!teacher && createMode === "promote" && (
          <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 text-xs font-semibold">
              <Briefcase className="w-4 h-4" />
              <span>Select Learner Account to Promote to Faculty</span>
            </div>

            {nonTeacherStudents.length === 0 ? (
              <p className="text-xs text-neutral-500">
                No non-faculty student accounts available to promote. Use &quot;New Profile&quot; instead.
              </p>
            ) : (
              <Select
                label="Select account to promote"
                value={selectedStudentId}
                onValueChange={handleSelectStudentToPromote}
                options={nonTeacherStudents.map((s) => ({
                  value: s.id,
                  label: `${s.name || "Unnamed"} (${s.email})`,
                }))}
                className="py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
              />
            )}
          </div>
        )}

        {/* Personal & Professional Profile */}
        <section className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-sky-500" />
            <span>Teacher Profile Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="px-3.5 py-2 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rajesh.sharma@jarvisaiacademy.com"
                className="px-3.5 py-2 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Title / Designation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Title / Designation
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead AI & Deep Learning Instructor"
                className="px-3.5 py-2 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Contact Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="px-3.5 py-2 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Specialization / Tech Stack */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Specialization & Expertise
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Full-Stack Web Development, React, FastAPI, Machine Learning, Cloud DevOps"
                className="px-3.5 py-2 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-neutral-400">
                Comma-separated subjects or technologies this teacher leads.
              </span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Account Status
              </label>
              <Select
                label="Account Status"
                value={status}
                onValueChange={(val) => setStatus(val as CandidateStatus)}
                options={[
                  { value: "active", label: "Active Faculty" },
                  { value: "inactive", label: "Inactive / On Leave" },
                  { value: "banned", label: "Banned / Restricted" },
                ]}
                className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Bio / Description */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Biography & Teaching Experience
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Provide a brief summary of their industry background, past projects, or teaching philosophy..."
              className="px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-y"
            />
          </div>
        </section>

        {/* Assigned Courses Section */}
        <section className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span>Assigned Courses</span>
            </h2>
            <span className="text-[11px] font-medium text-neutral-400">
              {assignedCourseIds.length} {assignedCourseIds.length === 1 ? "course" : "courses"} selected
            </span>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Select the academy programs this teacher instructs or mentors. Updating this syncs their assignment across course records in real time.
          </p>

          {coursesLoading ? (
            <div className="p-4 text-center text-xs text-neutral-400 animate-pulse">
              Loading courses list...
            </div>
          ) : courses.length === 0 ? (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/5 text-center text-xs text-neutral-400 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>No courses available in the catalog yet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Select
                multiple
                label="Assign courses"
                value={assignedCourseIds}
                onValueChange={setAssignedCourseIds}
                options={courses.map((c) => ({
                  value: c.id,
                  label: `#${c.number} ${c.title}`,
                }))}
                formatValue={(ids) => {
                  const list = ids as string[];
                  if (list.length === 0) return "No courses assigned";
                  if (list.length === 1) {
                    const found = courses.find((c) => c.id === list[0]);
                    return found ? `#${found.number} ${found.title}` : list[0];
                  }
                  return `${list.length} courses assigned`;
                }}
                className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
              />

              {/* Course badges preview */}
              {assignedCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {assignedCourseIds.map((cid) => {
                    const c = courses.find((item) => item.id === cid);
                    if (!c) return null;
                    return (
                      <span
                        key={cid}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/10"
                      >
                        <span className="font-bold opacity-60">#{c.number}</span>
                        <span>{c.title}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              if (teacher) {
                router.push(`/admin/teachers/${teacher.id}`);
              } else {
                shell.onNavigateTab("teachers");
                router.push("/admin");
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{teacher ? "Save Changes" : "Create Teacher"}</span>
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
