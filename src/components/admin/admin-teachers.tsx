"use client";

import React, { useMemo, useState } from "react";
import {
  Contact,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { useTeachers } from "@/providers/teachers-provider";
import { useCourses } from "@/providers/courses-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { TeacherRecord, TeacherStatus } from "@/data/teachers";

const inputClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500";
const selectClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs";
const labelClass = "text-[11px] font-semibold text-neutral-600 dark:text-neutral-400";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/**
 * Manage Teachers — the half of the courses↔teachers link that is a person.
 *
 * A teacher is not a login, so there is no invite, no role and no email here: this is a
 * record an admin keeps. Assigning courses writes `teachers.courseIds` and the matching
 * `courses.teacherIds` in the same batch (see `teachers-service.ts`), so picking courses in
 * the course editor or here produces the same edge.
 */
export function AdminTeachers() {
  const { teachers, loading, addTeacher, editTeacher, removeTeacher, setTeacherStatus } =
    useTeachers();
  const { courses } = useCourses();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formCourseIds, setFormCourseIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<TeacherStatus>("active");

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title })),
    [courses]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return teachers;
    const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? id;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.mobile.toLowerCase().includes(query) ||
        t.courseIds.some((id) => titleOf(id).toLowerCase().includes(query))
    );
  }, [teachers, searchQuery, courses]);

  const resetForm = () => {
    setEditing(null);
    setFormOpen(false);
    setFormName("");
    setFormMobile("");
    setFormCourseIds([]);
    setFormStatus("active");
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherRecord) => {
    setEditing(teacher);
    setFormName(teacher.name);
    setFormMobile(teacher.mobile);
    setFormCourseIds(teacher.courseIds ?? []);
    setFormStatus(teacher.status ?? "active");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast("Teacher name is required", "error");
      return;
    }
    // Loose on purpose: the academy's numbers are Indian mobiles, and a stricter pattern
    // would reject a perfectly reachable number for being formatted differently.
    if (!/^[\d\s+-]{6,}$/.test(formMobile.trim())) {
      showToast("Enter a contactable mobile number", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        mobile: formMobile.trim(),
        courseIds: formCourseIds,
        status: formStatus,
      };
      if (editing) {
        await editTeacher(editing.id, payload);
        showToast(`"${payload.name}" updated`, "success");
      } else {
        await addTeacher(payload);
        showToast(`"${payload.name}" added`, "success");
      }
      resetForm();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save teacher", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teacher: TeacherRecord) => {
    setBusyId(teacher.id);
    try {
      await removeTeacher(teacher.id);
      showToast(`"${teacher.name}" removed, and unassigned from their courses`, "success");
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete teacher", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (teacher: TeacherRecord) => {
    const next: TeacherStatus = teacher.status === "active" ? "inactive" : "active";
    setBusyId(teacher.id);
    try {
      await setTeacherStatus(teacher.id, next);
      showToast(`"${teacher.name}" is now ${next}`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-amber-600/10 border border-amber-500/20 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
            Teachers
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            The faculty assigned to each course. A teacher is a record, not a login — they
            never sign in here.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {formOpen && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Contact className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {editing ? `Edit ${editing.name}` : "New Teacher"}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              aria-label="Close form"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="teacher-name">
                Name
              </label>
              <input
                id="teacher-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Rohan Deshmukh"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="teacher-mobile">
                Mobile
              </label>
              <input
                id="teacher-mobile"
                type="text"
                inputMode="tel"
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Assigned Courses</span>
              <Select
                multiple
                label="Assigned courses"
                value={formCourseIds}
                onValueChange={setFormCourseIds}
                options={courseOptions}
                className={selectClass}
              />
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {formCourseIds.length === 0
                  ? "No courses assigned yet."
                  : formCourseIds.map(courseTitle).join(", ")}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Status</span>
              <Select
                label="Teacher status"
                value={formStatus}
                onValueChange={(next) => setFormStatus(next as TeacherStatus)}
                options={STATUS_OPTIONS}
                className={selectClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editing ? "Save Changes" : "Add Teacher"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Faculty Roster
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {teachers.length} {teachers.length === 1 ? "teacher" : "teachers"}
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, mobile or course..."
              className="w-56 sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Teacher</th>
                <th className="py-3 px-4 sm:px-6">Courses</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {loading && teachers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-neutral-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading teachers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-neutral-400">
                    <ShieldCheck className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    {teachers.length === 0
                      ? "No teachers yet. Add the first one above."
                      : "No teachers match that search."}
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {teacher.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {teacher.mobile}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      {teacher.courseIds?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.courseIds.map((id) => (
                            <span
                              key={id}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                            >
                              {courseTitle(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      {teacher.status === "inactive" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      {deleteConfirmId === teacher.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[11px] text-neutral-500">Delete?</span>
                          <button
                            type="button"
                            disabled={busyId === teacher.id}
                            onClick={() => handleDelete(teacher)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {busyId === teacher.id ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={busyId === teacher.id}
                            onClick={() => handleToggleStatus(teacher)}
                            title={teacher.status === "active" ? "Mark inactive" : "Mark active"}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {teacher.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(teacher)}
                            aria-label={`Edit ${teacher.name}`}
                            title="Edit"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(teacher.id)}
                            aria-label={`Delete ${teacher.name}`}
                            title="Delete"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
