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
  X,
} from "lucide-react";
import { useTeachers } from "@/providers/teachers-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { StatusSwitch } from "@/components/ui/switch";
import { TeacherRecord, TeacherStatus } from "@/data/teachers";
import { StudentRecord } from "@/data/assignments";

const inputClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500";
const selectClass =
  "w-full py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs";
const labelClass = "text-[11px] font-semibold text-neutral-600 dark:text-neutral-400";

// Enough to scroll through without putting a thousand rows in the DOM.
const PICKER_LIMIT = 50;

function initials(user: { name?: string; email?: string }): string {
  return (user.name || user.email || "?").slice(0, 2).toUpperCase();
}

function UserAvatar({ user, size }: { user: StudentRecord; size: "sm" | "md" }) {
  const box = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  if (user.picture) {
    return (
      <img
        src={user.picture}
        alt=""
        className={`${box} rounded-full border border-neutral-200 dark:border-white/10 object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${box} rounded-full bg-neutral-700 text-neutral-200 text-[10px] font-semibold shrink-0`}
    >
      {initials(user)}
    </div>
  );
}

/**
 * Manage Teachers — the faculty list, which is a slice of the accounts that already exist.
 *
 * A teacher is a signed-in user an admin designates, so there is no name field here: the
 * admin picks the account and the record is keyed by its uid (`teachers/{uid}`). Typing a
 * name would allow two records for one person, and a teacher who is not an account at all
 * can be both. Mobile is still typed, because Google hands us no phone number.
 *
 * Assigning courses writes `teachers.courseIds` and the matching `courses.teacherIds` in the
 * same batch (see `teachers-service.ts`), so picking courses in the course editor or here
 * produces the same edge.
 */
export function AdminTeachers() {
  const { teachers, loading, addTeacher, editTeacher, removeTeacher, setTeacherStatus } =
    useTeachers();
  // The course picker assigns to documents, so it lists only documents. With the fallback in,
  // its twelve built-in options each wrote `arrayUnion` to a course that does not exist and
  // failed the whole batch — the error Sugat hit adding a teacher.
  const { firestoreCourses: courses } = useCourses();
  const { students } = useStudents();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formCourseIds, setFormCourseIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<TeacherStatus>("active");
  const [userQuery, setUserQuery] = useState("");

  const userById = useMemo(() => {
    const map = new Map<string, StudentRecord>();
    for (const student of students) map.set(student.id, student);
    return map;
  }, [students]);

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.title })),
    [courses]
  );

  const teaching = useMemo(() => new Set(teachers.map((t) => t.id)), [teachers]);

  // Only accounts that can actually take the role: a banned candidate is not faculty, and
  // one already on the list would be refused by the service anyway.
  const pickable = useMemo(
    () => students.filter((s) => s.status !== "banned" && !teaching.has(s.id)),
    [students, teaching]
  );

  const candidates = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return pickable;
    return pickable.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(query) ||
        (s.email || "").toLowerCase().includes(query)
    );
  }, [pickable, userQuery]);

  const selectedUser = formUserId ? userById.get(formUserId) : undefined;

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return teachers;
    const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? id;
    return teachers.filter((t) => {
      // The live user record is the better search source, since a name edited on the account
      // after they joined the faculty would otherwise not be findable here.
      const user = userById.get(t.id);
      return (
        t.name.toLowerCase().includes(query) ||
        (user?.name || "").toLowerCase().includes(query) ||
        (user?.email || "").toLowerCase().includes(query) ||
        t.mobile.toLowerCase().includes(query) ||
        t.courseIds.some((id) => titleOf(id).toLowerCase().includes(query))
      );
    });
  }, [teachers, searchQuery, courses, userById]);

  const resetForm = () => {
    setEditing(null);
    setFormOpen(false);
    setFormUserId("");
    setFormMobile("");
    setFormCourseIds([]);
    setFormStatus("active");
    setUserQuery("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherRecord) => {
    setEditing(teacher);
    setFormUserId(teacher.id);
    setFormMobile(teacher.mobile);
    setFormCourseIds(teacher.courseIds ?? []);
    setFormStatus(teacher.status ?? "active");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!editing && !formUserId) {
      showToast("Choose the account that becomes a teacher", "error");
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
        mobile: formMobile.trim(),
        courseIds: formCourseIds,
        status: formStatus,
      };
      if (editing) {
        await editTeacher(editing.id, payload);
        showToast(`"${selectedUser?.name || editing.name}" updated`, "success");
      } else {
        await addTeacher({ ...payload, userId: formUserId });
        showToast(`"${selectedUser?.name || "Account"}" is now a teacher`, "success");
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

  const handleToggleStatus = async (teacher: TeacherRecord, next: TeacherStatus) => {
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
            The faculty assigned to each course. A teacher is a signed-in account an admin
            promotes here — pick the account and it becomes a teacher.
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
                {editing
                  ? `Edit ${selectedUser?.name || editing.name}`
                  : "Promote an account to teacher"}
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

          {/* The account is the identity, so it is chosen once and never swapped: moving a
              teacher to a different uid would have to unlink every course the old one held. */}
          {editing ? (
            selectedUser && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                <UserAvatar user={selectedUser} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {selectedUser.name || "—"}
                  </span>
                  <span className="text-[11px] text-neutral-500 truncate">
                    {selectedUser.email}
                  </span>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Account</span>

              {selectedUser ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30">
                  <UserAvatar user={selectedUser} size="md" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {selectedUser.name || "—"}
                    </span>
                    <span className="text-[11px] text-neutral-500 truncate">
                      {selectedUser.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormUserId("")}
                    className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Search accounts by name or email..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 dark:border-white/10 divide-y divide-neutral-200 dark:divide-white/5">
                    {students.length === 0 ? (
                      <p className="p-4 text-[11px] text-neutral-500 text-center">
                        No accounts yet — nobody has signed in with Google.
                      </p>
                    ) : pickable.length === 0 ? (
                      <p className="p-4 text-[11px] text-neutral-500 text-center">
                        Every account is already a teacher.
                      </p>
                    ) : candidates.length === 0 ? (
                      <p className="p-4 text-[11px] text-neutral-500 text-center">
                        No account matches that search.
                      </p>
                    ) : (
                      candidates.slice(0, PICKER_LIMIT).map((candidate) => (
                        <button
                          key={candidate.id}
                          type="button"
                          onClick={() => setFormUserId(candidate.id)}
                          className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <UserAvatar user={candidate} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                              {candidate.name || "—"}
                            </span>
                            <span className="text-[11px] text-neutral-500 truncate">
                              {candidate.email}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {candidates.length > PICKER_LIMIT && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Showing the first {PICKER_LIMIT} of {candidates.length} — search to narrow
                      it down.
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
              <span className={labelClass}>Status</span>
              <StatusSwitch
                checked={formStatus === "active"}
                onCheckedChange={(next) => setFormStatus(next ? "active" : "inactive")}
                label="Teacher status"
              />
            </div>

            {/* Full width and last: the selections are chips, and chips need the room. In a
                half-width column a teacher with five courses pushed the trigger's label past
                the edge of the card. */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <span className={labelClass}>Assigned Courses</span>
              <Select
                multiple
                label="Assigned courses"
                value={formCourseIds}
                onValueChange={setFormCourseIds}
                options={courseOptions}
                className={selectClass}
                // The trigger counts them; the names are chips underneath, where they can
                // wrap and be read together.
                formatValue={(value) => {
                  const picked = Array.isArray(value) ? value : [];
                  if (picked.length === 0) return "Choose courses";
                  return picked.length === 1 ? "1 course assigned" : `${picked.length} courses assigned`;
                }}
              />

              {formCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formCourseIds.map((id) => (
                    <span
                      key={id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10"
                    >
                      {courseTitle(id)}
                    </span>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {/* The picker is empty until the catalogue is stored, and an empty dropdown
                    with no explanation reads as a bug. */}
                {courses.length === 0
                  ? "No courses are stored yet, so there is nothing to assign."
                  : formCourseIds.length === 0
                    ? "No courses assigned yet."
                    : "Open the list to change the assignment."}
              </span>
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
              placeholder="Search name, email, mobile or course..."
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
                      ? "No teachers yet. Promote an account above."
                      : "No teachers match that search."}
                  </td>
                </tr>
              ) : (
                filtered.map((teacher) => {
                  const user = userById.get(teacher.id);
                  const displayName = user?.name || teacher.name;
                  // Anything that is not explicitly inactive counts as active — the field is
                  // optional, and a teacher record written before it existed is a live one.
                  const isActive = teacher.status !== "inactive";
                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {user && <UserAvatar user={user} size="md" />}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-neutral-900 dark:text-white">
                              {displayName}
                            </span>
                            {user?.email && (
                              <span className="text-[11px] text-neutral-500 truncate">
                                {user.email}
                              </span>
                            )}
                            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {teacher.mobile}
                            </span>
                          </div>
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
                        <StatusSwitch
                          checked={isActive}
                          onCheckedChange={(next) =>
                            handleToggleStatus(teacher, next ? "active" : "inactive")
                          }
                          disabled={busyId === teacher.id}
                          label={`Make ${displayName} ${isActive ? "inactive" : "active"}`}
                        />
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
                              onClick={() => handleOpenEdit(teacher)}
                              aria-label={`Edit ${displayName}`}
                              title="Edit"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(teacher.id)}
                              aria-label={`Delete ${displayName}`}
                              title="Delete"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-neutral-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
