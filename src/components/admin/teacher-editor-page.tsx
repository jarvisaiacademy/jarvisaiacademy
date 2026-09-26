"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  UserPlus,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Pencil,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { AdminPage } from "@/components/admin/admin-page";
import {
  createTeacherInFirestore,
  createStudentInFirestore,
  updateCandidateInFirestore,
  syncStudentEnrollments,
} from "@/services/students-service";
import {
  syncTeacherCourseAssignments,
  removeTeacherFromAllCourses,
} from "@/services/courses-service";
import type { AdminShellState } from "@/components/admin/admin-shell";
import type { CandidateStatus, StudentRecord } from "@/data/students";

interface TeacherEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating a teacher */
  teacherId?: string;
}

export function TeacherEditorPage({ teacherId, shell }: TeacherEditorPageProps) {
  const router = useRouter();
  const { students, loading: studentsLoading } = useStudents();
  const { loading: coursesLoading } = useCourses();

  const teacher = teacherId ? students.find((s) => s.id === teacherId) : null;

  // Waiting on the roster subscription
  if (teacherId && (studentsLoading || students.length === 0)) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
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
              shell.onNavigateTab("teachers");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Teachers
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Loading...
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading teacher details...
        </div>
      </AdminPage>
    );
  }

  if (teacherId && !teacher) {
    return (
      <AdminPage shell={shell} maxWidth="max-w-none px-3 sm:px-6">
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
              shell.onNavigateTab("teachers");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Teachers
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Not Found
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No teacher account with this id. It may have been removed or the link is incorrect.
          </p>
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("teachers");
              router.push("/admin");
            }}
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
  const [status, setStatus] = useState<CandidateStatus>(() =>
    teacher?.status === "inactive" || teacher?.status === "banned" ? "inactive" : "active"
  );
  const [role, setRole] = useState<"teacher" | "student">(() =>
    teacher ? (teacher.is_teacher ? "teacher" : "student") : "teacher"
  );
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

  const handleCancel = () => {
    if (teacher) {
      router.push(`/admin/teachers/${teacher.id}`);
    } else {
      shell.onNavigateTab("teachers");
      router.push("/admin");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showToast("A valid email address is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      let savedTeacherId = teacher?.id;
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const newIsTeacher = role === "teacher";

      if (teacher) {
        // UPDATE existing teacher
        await updateCandidateInFirestore(
          teacher.id,
          {
            name: cleanName,
            email: cleanEmail,
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
            is_teacher: newIsTeacher,
          },
          user?.email,
          user?.name
        );
      } else {
        // CREATE new teacher or PROMOTE existing account
        if (newIsTeacher) {
          let targetExistingId =
            createMode === "promote" && selectedStudentId ? selectedStudentId : undefined;
          if (!targetExistingId) {
            const matched = students.find((s) => s.email?.trim().toLowerCase() === cleanEmail);
            if (matched) {
              targetExistingId = matched.id;
            }
          }

          savedTeacherId = await createTeacherInFirestore(
            {
              name: cleanName,
              email: cleanEmail,
              title: title.trim() || undefined,
              specialization: specialization.trim() || undefined,
              bio: bio.trim() || undefined,
              phone: phone.trim() || undefined,
              status: "active",
              existingUserId: targetExistingId,
            },
            user?.email,
            user?.name
          );
        } else {
          savedTeacherId = await createStudentInFirestore(
            {
              name: cleanName,
              email: cleanEmail,
              title: title.trim() || undefined,
              specialization: specialization.trim() || undefined,
              bio: bio.trim() || undefined,
              phone: phone.trim() || undefined,
              status: "active",
              enrolledCourseIds: assignedCourseIds,
            },
            user?.email,
            user?.name
          );
        }
      }

      // Synchronize course assignments / enrollments based on role
      if (savedTeacherId) {
        if (newIsTeacher) {
          await syncTeacherCourseAssignments(
            savedTeacherId,
            assignedCourseIds,
            user?.email,
            cleanEmail
          );
        } else {
          if (teacher && teacher.is_teacher) {
            await removeTeacherFromAllCourses(savedTeacherId, user?.email);
          }
          await syncStudentEnrollments(cleanEmail, cleanName, assignedCourseIds, courses, user?.email);
        }
      }

      showToast(
        teacher
          ? `${newIsTeacher ? "Teacher" : "Student"} "${cleanName}" updated successfully`
          : `${newIsTeacher ? "Teacher" : "Student"} "${cleanName}" created successfully`,
        "success"
      );

      if (teacher) {
        if (newIsTeacher) {
          router.push(`/admin/teachers/${teacher.id}`);
        } else {
          router.push(`/admin/students/${teacher.id}`);
        }
      } else {
        if (newIsTeacher) {
          shell.onNavigateTab("teachers");
        } else {
          shell.onNavigateTab("students");
        }
        router.push("/admin");
      }
    } catch (err: unknown) {
      console.error("[TeacherForm] Failed to save teacher:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("permission-denied")
      ) {
        showToast(
          `Permission denied for ${user?.email || "this account"}. Please publish the latest firestore.rules in Firebase Console.`,
          "error"
        );
      } else if (
        errMsg.includes("ERR_BLOCKED_BY_CLIENT") ||
        errMsg.includes("blocked") ||
        errMsg.includes("unavailable")
      ) {
        showToast(
          "Network request blocked by a browser extension (e.g. ad blocker, Brave Shields, or privacy tool). Please disable it or whitelist this site to save.",
          "error"
        );
      } else {
        showToast(errMsg || "Failed to save teacher", "error");
      }
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
              shell.onNavigateTab("teachers");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Teachers
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {teacher ? `Edit ${teacher.name || "Teacher"}` : "Add Teacher"}
          </span>
        </nav>

        {/* Big Card containing form */}
        <form onSubmit={handleSubmit} className="w-full pb-16">
          <div className="w-full rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
            {/* Header: Back button on left, centered Heading Add New Teacher */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                {/* Back button inside the card */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                    title="Back to Teachers"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                {/* Center: Heading Add New Teacher */}
                <div className="flex items-center justify-center">
                  <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center">
                    {teacher ? "Edit Teacher" : "Add New Teacher"}
                  </h1>
                </div>

                {/* Spacer to balance the Back button for mathematical centering */}
                <div className="w-[72px] invisible" aria-hidden="true" />
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* Creator Mode Selector (Only on New Teacher) */}
              {!teacher && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                      Teacher Source
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Create a faculty profile directly or promote an existing registered learner.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-200/60 dark:bg-white/5 border border-neutral-200 dark:border-white/10 self-stretch sm:self-auto">
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
                <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 flex flex-col gap-2.5">
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

              {/* 4-GRID at the Add Page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Full Name */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@jarvisaiacademy.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Title / Designation */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Title / Designation
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lead AI Instructor"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 5. Specialization & Expertise */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Specialization & Expertise
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Full-Stack Web, React, Python"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 6. Account Role Dropdown */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Account Role
                  </label>
                  <Select
                    label="Account Role"
                    value={role}
                    onValueChange={(val) => setRole(val as "teacher" | "student")}
                    options={[
                      { value: "teacher", label: "Teacher / Faculty" },
                      { value: "student", label: "Student / Learner" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 7. Account Status (Only shown when editing existing teacher) */}
                {teacher && (
                  <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Account Status
                    </label>
                    <Select
                      label="Account Status"
                      value={status}
                      onValueChange={(val) => setStatus(val as CandidateStatus)}
                      options={[
                        { value: "active", label: role === "teacher" ? "Active Faculty" : "Active Student" },
                        { value: "inactive", label: role === "teacher" ? "Inactive / On Leave" : "Inactive / Paused" },
                      ]}
                      className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                    />
                  </div>
                )}

                {/* 8. Assigned Courses (spans 1 column on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {role === "teacher" ? "Assigned Courses" : "Enrolled Courses"}
                  </label>
                  {coursesLoading ? (
                    <div className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-400 text-xs animate-pulse">
                      Loading courses...
                    </div>
                  ) : (
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
                        if (list.length === 0) return "No courses";
                        if (list.length === 1) {
                          const found = courses.find((c) => c.id === list[0]);
                          return found ? `#${found.number} ${found.title}` : list[0];
                        }
                        return `${list.length} courses`;
                      }}
                      className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                    />
                  )}
                </div>

                {/* Badges for assigned courses if any */}
                {assignedCourseIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4 -mt-1">
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

                {/* 8. Biography & Teaching Experience (spans all 4 columns) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Biography & Teaching Experience
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Provide a brief summary of industry background, past projects, or teaching philosophy..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Cancel on left with cancel icon, Add Teacher pill button on right */}
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

              {/* Bottom Right: Add / Save Teacher pill button */}
              <button
                type="submit"
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                  teacher ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : teacher ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{teacher ? "Save Changes" : "Add Teacher"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}
