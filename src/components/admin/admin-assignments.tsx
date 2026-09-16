"use client";

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  BookOpen,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useCourses } from "@/providers/courses-provider";
import { useAssignments } from "@/providers/assignments-provider";
import { useToast } from "@/components/ui/toast";

export function AdminAssignments() {
  const { students, loading: studentsLoading } = useStudents();
  const { courses } = useCourses();
  const {
    assignments,
    loading: assignmentsLoading,
    assignCourse,
    revokeAssignment,
    restoreAssignment,
  } = useAssignments();
  const { showToast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeCount = assignments.filter((a) => a.status === "active").length;

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return assignments;
    return assignments.filter(
      (a) =>
        a.studentName.toLowerCase().includes(query) ||
        a.studentEmail.toLowerCase().includes(query) ||
        a.courseTitle.toLowerCase().includes(query)
    );
  }, [assignments, searchQuery]);

  const handleAssign = async () => {
    const student = students.find((s) => s.id === selectedStudentId);
    const course = courses.find((c) => c.id === selectedCourseId);

    if (!student || !course) {
      showToast("Select both a student and a course", "error");
      return;
    }

    setIsAssigning(true);
    try {
      await assignCourse(student, course);
      showToast(`Assigned "${course.title}" to ${student.name}`, "success");
      setSelectedCourseId("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign course";
      showToast(msg, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyId(id);
    try {
      await revokeAssignment(id);
      setRevokeConfirmId(null);
      showToast("Access revoked", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke access";
      showToast(msg, "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (id: string) => {
    setBusyId(id);
    try {
      await restoreAssignment(id);
      showToast("Access restored", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restore access";
      showToast(msg, "error");
    } finally {
      setBusyId(null);
    }
  };

  const noRoster = !studentsLoading && students.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-emerald-600/10 border border-indigo-500/20 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            Course Assignments
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Grant a learner free access to any course. Independent of payments and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeCount} Active Grants
          </span>
        </div>
      </div>

      {/* Assign Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Assign a Course
          </h3>
        </div>

        {noRoster ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              No learners in the roster yet. Learners appear here automatically after they
              sign in once, then you can assign courses to them.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">
                {studentsLoading ? "Loading learners..." : "Select learner..."}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.email}
                </option>
              ))}
            </select>

            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isAssigning || !selectedStudentId || !selectedCourseId}
              onClick={handleAssign}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>{isAssigning ? "Assigning..." : "Assign Course"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Assignments Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Access Grants Ledger
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Everyone who has been granted course access directly by an admin.
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search learner or course..."
              className="w-56 sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Learner</th>
                <th className="py-3 px-4 sm:px-6">Course</th>
                <th className="py-3 px-4 sm:px-6">Assigned By</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {assignmentsLoading && assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading assignments...
                  </td>
                </tr>
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((a) => {
                  const courseExists = courses.some((c) => c.id === a.courseId);
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {a.studentName}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {a.studentEmail}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {a.courseTitle}
                          </span>
                          {!courseExists && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              deleted
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                        {a.assignedByEmail}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        {a.status === "active" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30">
                            <XCircle className="w-3 h-3" />
                            Revoked
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {a.status === "active" ? (
                          busyId === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-neutral-400 inline" />
                          ) : revokeConfirmId === a.id ? (
                            <div className="flex items-center justify-end gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                              <button
                                type="button"
                                onClick={() => handleRevoke(a.id)}
                                className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setRevokeConfirmId(null)}
                                className="px-1 text-[10px] text-neutral-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRevokeConfirmId(a.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Revoke
                            </button>
                          )
                        ) : busyId === a.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-400 inline" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(a.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-neutral-400">
                    <BookOpen className="w-5 h-5 mx-auto mb-2 opacity-60" />
                    No assignments yet. Assign a course above to grant access.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer metrics */}
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-white/10 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {students.length} learners in roster
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            {activeCount} active grants
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminAssignments;
