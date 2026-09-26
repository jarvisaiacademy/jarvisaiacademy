"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  X,
  Plus,
  Pencil,
  Sparkles,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { AdminPage } from "@/components/admin/admin-page";
import { useAllEnrollments } from "@/hooks/use-student-enrollments";
import {
  createStudentInFirestore,
  createTeacherInFirestore,
  updateCandidateInFirestore,
  syncStudentEnrollments,
} from "@/services/students-service";
import {
  syncTeacherCourseAssignments,
  removeTeacherFromAllCourses,
} from "@/services/courses-service";
import type { AdminShellState } from "@/components/admin/admin-shell";
import type { CandidateStatus, StudentRecord } from "@/data/students";

interface StudentEditorPageProps {
  shell: AdminShellState;
  /** Omitted when creating a student */
  studentId?: string;
}

export function StudentEditorPage({ studentId, shell }: StudentEditorPageProps) {
  const router = useRouter();
  const { students, loading: studentsLoading } = useStudents();
  const { loading: coursesLoading } = useCourses();
  const { loading: enrollmentsLoading } = useAllEnrollments();

  const student = studentId ? students.find((s) => s.id === studentId) : null;

  // Waiting on the roster subscription
  if (studentId && (studentsLoading || students.length === 0)) {
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
              shell.onNavigateTab("students");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Students
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Loading...
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400 animate-pulse">
          Loading student details...
        </div>
      </AdminPage>
    );
  }

  if (studentId && !student) {
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
              shell.onNavigateTab("students");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Students
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            Not Found
          </span>
        </nav>
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No student account with this id. It may have been removed or the link is incorrect.
          </p>
          <button
            type="button"
            onClick={() => {
              shell.onNavigateTab("students");
              router.push("/admin");
            }}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Back to Students
          </button>
        </div>
      </AdminPage>
    );
  }

  return (
    <StudentForm
      key={student?.id ?? "new"}
      student={student ?? null}
      shell={shell}
      coursesLoading={coursesLoading || enrollmentsLoading}
    />
  );
}

interface StudentFormProps {
  student: StudentRecord | null;
  shell: AdminShellState;
  coursesLoading: boolean;
}

function StudentForm({ student, shell, coursesLoading }: StudentFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { firestoreCourses: courses } = useCourses();
  const { enrollments } = useAllEnrollments();

  // Initial enrolled courses for this student
  const initialCourseIds = useMemo(() => {
    if (!student) return [];
    const ids = new Set<string>(student.enrolledCourseIds || []);
    const email = (student.email || "").toLowerCase();
    if (email) {
      for (const e of enrollments) {
        if ((e.studentEmail || "").toLowerCase() === email && e.action === "paid") {
          ids.add(e.courseId);
        }
      }
    }
    return Array.from(ids);
  }, [student, enrollments]);

  const [name, setName] = useState(() => student?.name ?? "");
  const [email, setEmail] = useState(() => student?.email ?? "");
  const [title, setTitle] = useState(() => student?.title ?? "");
  const [specialization, setSpecialization] = useState(() => student?.specialization ?? "");
  const [phone, setPhone] = useState(() => student?.phone ?? "");
  const [bio, setBio] = useState(() => student?.bio ?? "");
  const [status, setStatus] = useState<CandidateStatus>(() =>
    student?.status === "inactive" || student?.status === "banned" ? "inactive" : "active"
  );
  const [role, setRole] = useState<"student" | "teacher">(() =>
    student?.is_teacher ? "teacher" : "student"
  );
  const [isSuper10, setIsSuper10] = useState<boolean>(() => student?.is_super10 ?? false);
  const [referralCode, setReferralCode] = useState(() => student?.referralCode ?? "");
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>(initialCourseIds);
  const [isSaving, setIsSaving] = useState(false);

  const handleCancel = () => {
    if (student) {
      router.push(`/admin/students/${student.id}`);
    } else {
      shell.onNavigateTab("students");
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
      let savedStudentId = student?.id;
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();
      const newIsTeacher = role === "teacher";

      if (student) {
        // UPDATE existing student
        await updateCandidateInFirestore(
          student.id,
          {
            name: cleanName,
            email: cleanEmail,
            title: title.trim() || undefined,
            specialization: specialization.trim() || undefined,
            bio: bio.trim() || undefined,
            phone: phone.trim() || undefined,
            status,
            is_super10: isSuper10,
            referralCode: referralCode.trim() || undefined,
            enrolledCourseIds: assignedCourseIds,
            is_teacher: newIsTeacher,
          },
          user?.email,
          user?.name
        );
      } else {
        // CREATE new student or teacher
        if (newIsTeacher) {
          savedStudentId = await createTeacherInFirestore(
            {
              name: cleanName,
              email: cleanEmail,
              title: title.trim() || undefined,
              specialization: specialization.trim() || undefined,
              bio: bio.trim() || undefined,
              phone: phone.trim() || undefined,
              status: "active",
            },
            user?.email,
            user?.name
          );
        } else {
          savedStudentId = await createStudentInFirestore(
            {
              name: cleanName,
              email: cleanEmail,
              title: title.trim() || undefined,
              specialization: specialization.trim() || undefined,
              bio: bio.trim() || undefined,
              phone: phone.trim() || undefined,
              status: "active",
              is_super10: isSuper10,
              referralCode: referralCode.trim() || undefined,
              enrolledCourseIds: assignedCourseIds,
            },
            user?.email,
            user?.name
          );
        }
      }

      // Synchronize course assignments / enrollments based on role
      if (savedStudentId) {
        if (newIsTeacher) {
          await syncTeacherCourseAssignments(savedStudentId, assignedCourseIds, user?.email);
        } else {
          if (student && student.is_teacher) {
            await removeTeacherFromAllCourses(savedStudentId, user?.email);
          }
          if (cleanEmail) {
            await syncStudentEnrollments(
              cleanEmail,
              cleanName,
              assignedCourseIds,
              courses,
              user?.email
            );
          }
        }
      }

      showToast(
        student
          ? `${newIsTeacher ? "Teacher" : "Student"} "${cleanName}" updated successfully`
          : `${newIsTeacher ? "Teacher" : "Student"} "${cleanName}" created successfully`,
        "success"
      );

      if (student) {
        if (newIsTeacher) {
          router.push(`/admin/teachers/${student.id}`);
        } else {
          router.push(`/admin/students/${student.id}`);
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
      console.error("[StudentForm] Failed to save student:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes("permission") ||
        errMsg.toLowerCase().includes("permission-denied")
      ) {
        showToast(
          `Permission denied for ${user?.email || "this account"}. Please check Firebase rules.`,
          "error"
        );
      } else {
        showToast(errMsg || "Failed to save student", "error");
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
              shell.onNavigateTab("students");
              router.push("/admin");
            }}
            className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Students
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 dark:text-white">
            {student ? `Edit ${student.name || "Student"}` : "Add Student"}
          </span>
        </nav>

        {/* Big Card containing form */}
        <form onSubmit={handleSubmit} className="w-full pb-16">
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
                    title="Back to Students"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                {/* Center: Heading Add New Student */}
                <div className="flex items-center justify-center">
                  <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white text-center">
                    {student ? "Edit Student" : "Add New Student"}
                  </h1>
                </div>

                {/* Spacer to balance the Back button for mathematical centering */}
                <div className="w-[72px] invisible" aria-hidden="true" />
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* 4-GRID */}
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
                    placeholder="e.g. Aarav Patel"
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
                    placeholder="e.g. aarav@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. Target Track / Goal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Target Track / Designation
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Aspiring Full-Stack Developer"
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

                {/* 5. Specialization & Interests (1 col on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-1">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Specialization & Domain Interests
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Next.js, TypeScript, AI"
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
                    onValueChange={(val) => setRole(val as "student" | "teacher")}
                    options={[
                      { value: "student", label: "Student / Learner" },
                      { value: "teacher", label: "Teacher / Faculty" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 7. Account Status (Only shown when editing existing student) */}
                {student && (
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

                {/* 8. Enrolled Courses (spans 1 column on lg) */}
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

                {/* 8. Super10 Scholar Cohort (spans 2 columns on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Super10 Scholar Cohort
                  </label>
                  <Select
                    label="Super10 Status"
                    value={isSuper10 ? "yes" : "no"}
                    onValueChange={(val) => setIsSuper10(val === "yes")}
                    options={[
                      { value: "no", label: "Standard Student" },
                      { value: "yes", label: "Super10 Elite Scholar" },
                    ]}
                    className="py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />
                </div>

                {/* 9. Referral Code (spans 2 columns on lg) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-1 lg:col-span-2">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    VIP Referral Code
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. JAR-VIP001"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* 10. Biography & Student Notes (spans all 4 columns) */}
                <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Biography & Learning Goals / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter academic background, project aspirations, mentor notes, or career goals..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Bar: Cancel on left with cancel icon, Add / Save Student pill button on right */}
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

              {/* Bottom Right: Add / Save Student pill button */}
              <button
                type="submit"
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                  student ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : student ? (
                  <Pencil className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{student ? "Save Changes" : "Add Student"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminPage>
  );
}
