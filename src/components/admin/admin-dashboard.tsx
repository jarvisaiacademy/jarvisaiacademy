"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  IndianRupee,
  GraduationCap,
  ArrowLeft,
  Download,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  BookOpen,
  Layers,
  X,
  AlertCircle,
  Check,
  PanelLeft,
  Star,
  Briefcase,
} from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateCandidateInFirestore } from "@/services/students-service";
import { accountRoleOf, CandidateStatus, StudentRecord, type AccountRole } from "@/data/students";
import { APP_SETTINGS } from "@/data/app-settings";
import { academyKnowledge } from "@/data/academy-knowledge";
import { isPublic } from "@/lib/courses-server";
import { CourseItem, COURSE_CATEGORIES, CourseCategoryId, CourseStatus } from "@/data/courses";
import { DevIcon } from "@/components/ui/dev-icon";
import { StatusSwitch } from "@/components/ui/switch";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/components/ui/toast";

import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { UserProfile } from "@/components/layout/user-profile";
import { AdminKnowledge } from "@/components/admin/admin-knowledge";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { shortcutById } from "@/data/shortcuts";
import { isTypingTarget, matchesShortcut } from "@/lib/keyboard";

interface EnrollmentRecord {
  action: string;
  courseId: string;
  courseName: string;
  amount: number;
  transactionId: string;
  studentName: string;
  studentEmail: string;
  timestamp: string;
}

/** Roster rows carry the ISO string written at sign-in; show it like the ledger's dates. */
function formatSignIn(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The three roles a person can hold on this site, and how each one's badge reads.
 *
 * Teacher is not stored anywhere — see `renderRole`. Sky rather than amber because amber
 * already means Super10 in this same table, and one row must not carry two amber chips.
 */
const ROLE_BADGE = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    badge:
      "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
  },
  teacher: {
    label: "Teacher",
    icon: Briefcase,
    badge:
      "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  },
  student: {
    label: "Student",
    icon: GraduationCap,
    badge:
      "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/10",
  },
} as const;

/**
 * The framing around each role's roster table. The table is the same three times, so the
 * words that differ — the page title in the header, and what an empty page means — are
 * stated once here rather than inline three times.
 */
const ROLE_PAGE = {
  student: {
    title: "Students",
    empty: "No learner accounts yet — nobody has signed in with Google.",
  },
  admin: {
    title: "Admins",
    empty: "No admin accounts found.",
  },
  teacher: {
    title: "Teachers",
    empty: "No faculty yet — mark an account as Teacher from the Teacher column.",
  },
} as const satisfies Record<AccountRole, unknown>;

interface AdminDashboardProps {
  activeTab?: DashboardTab;
  onChangeTab?: (tab: DashboardTab) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function AdminDashboard({
  activeTab: controlledTab,
  onChangeTab,
  sidebarOpen = true,
  onToggleSidebar,
}: AdminDashboardProps) {
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const {
    students,
    loading: studentsLoading,
    error: studentsError,
  } = useStudents();
  // `firestoreCourses`, not `courses`: this tab lists what is in the database. With the
  // COURSES_DATA fallback in front of it the twelve built-in courses appeared here as if they
  // were stored, and saving one failed the write because no such document existed.
  const {
    firestoreCourses: courses,
    loading: coursesLoading,
    addCourse,
    editCourse,
    removeCourse,
  } = useCourses();

  // Firestore has no joins, so the courses table assembles its own. A course's `teacherIds` are
  // user ids, and `studentsById` is where their names and pictures come from.
  const studentsById = useMemo(() => {
    const map = new Map(students.map((s) => [s.id, s] as const));
    return map;
  }, [students]);

  // The people a course can be assigned to: the accounts an admin has marked as faculty.
  const faculty = useMemo(() => students.filter((s) => s.is_teacher), [students]);

  const [localTab, setLocalTab] = useState<DashboardTab>("courses");
  const activeTab: DashboardTab = controlledTab || localTab;
  const setActiveTab = (tab: DashboardTab) => {
    setLocalTab(tab);
    onChangeTab?.(tab);
  };

  // Admissions state
  const [records, setRecords] = useState<EnrollmentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Courses management state
  const [courseSearch, setCourseSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for Add / Edit modal
  const [formId, setFormId] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBannerTitle, setFormBannerTitle] = useState("");
  const [formBannerSubtitle, setFormBannerSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<CourseItem["category"]>("web");
  const [formCategoryLabel, setFormCategoryLabel] = useState("Web & Full-Stack");
  const [formBadge, setFormBadge] = useState("");
  const [formBadgeType, setFormBadgeType] = useState<CourseItem["badgeType"] | "">("");
  const [formDuration, setFormDuration] = useState("60 Days (2 Months)");
  const [formLevel, setFormLevel] = useState("Beginner to Adv");
  const [formFee, setFormFee] = useState("₹30,000");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formTechStack, setFormTechStack] = useState("");
  const [formTechIcons, setFormTechIcons] = useState("");
  const [formTopics, setFormTopics] = useState("");
  const [formActionPrompt, setFormActionPrompt] = useState("");
  const [formStatus, setFormStatus] = useState<CourseStatus>("active");
  const [formTeacherIds, setFormTeacherIds] = useState<string[]>([]);

  // Candidate rows are edited on the spot — the two admin-owned fields are the whole
  // edit surface, so a modal would be a dialog around two controls.
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);

  // The roster's filters. One pair of them, shared by the three role pages — they filter the
  // same table — and cleared when the page changes, because a query typed while looking at
  // Students would otherwise keep hiding rows on Teachers with nothing on screen to say so.
  // Adjusted during render rather than in an effect, so the reset lands in the same commit as
  // the new tab and the next page never paints a filtered table for a frame.
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterStatus, setRosterStatus] = useState<"all" | CandidateStatus>("all");
  const [filtersTab, setFiltersTab] = useState(activeTab);

  if (filtersTab !== activeTab) {
    setFiltersTab(activeTab);
    setRosterQuery("");
    setRosterStatus("all");
  }

  const handleCandidateStatus = async (uid: string, status: CandidateStatus) => {
    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { status }, user?.email);
      showToast(`Candidate marked ${status}`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };

  // Flipped from the table row rather than only from the editor: hiding a course is the one
  // course change an admin makes in a hurry, and opening a modal to make it was the long way.
  const handleCourseStatus = async (course: CourseItem, status: CourseStatus) => {
    try {
      await editCourse(course.id, { status });
      showToast(
        status === "active" ? `"${course.title}" is listed publicly` : `"${course.title}" is hidden`,
        "success"
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update the course", "error");
    }
  };

  const handleToggleSuper10 = async (uid: string, current: boolean) => {
    const next = !current;
    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { is_super10: next }, user?.email);
      showToast(next ? "Super10 granted" : "Super10 removed", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };

  // Faculty membership is this flag and nothing else. Marking someone moves them to the
  // Teachers page, since `accountRoleOf` reads it; unmarking moves them back.
  const handleToggleTeacher = async (uid: string, current: boolean) => {
    const next = !current;
    setBusyCandidateId(uid);
    try {
      await updateCandidateInFirestore(uid, { is_teacher: next }, user?.email);
      showToast(next ? "Marked as faculty" : "Faculty mark removed", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update candidate", "error");
    } finally {
      setBusyCandidateId(null);
    }
  };

  // The ledger is the enrolments that actually happened, read back from the tracker
  // the chat writes. A hardcoded set of demo students used to be merged in here, which
  // showed fabricated registrations as though they were real ones.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jarvis_enrollment_tracker");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setRecords(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Only live while the dashboard is mounted, so these never fight the shortcuts
  // on the chat view.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (matchesShortcut(event, shortcutById("search"))) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (matchesShortcut(event, shortcutById("filter"))) {
        event.preventDefault();
        setFilterOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter admissions
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transactionId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && r.action === "paid") ||
      (statusFilter === "pending" && r.action !== "paid");
    return matchesSearch && matchesStatus;
  });

  const totalPaidRevenue = records
    .filter((r) => r.action === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalPaidStudents = records.filter((r) => r.action === "paid").length;
  const super10Count = records.filter(
    (r) => r.courseId === "super10" && r.action === "paid"
  ).length;

  // The academy's business figures, hard-coded in `src/data/app-settings.ts`. Changing one is a
  // code change and a deploy, on purpose: the same numbers are printed on the receipt and the
  // enrolment card, and an editor that can disagree with the receipt is worse than no editor.
  const { referralReward, super10Seats } = APP_SETTINGS;
  // Pricing is quoted all-inclusive, so the tax breakdown divides tax back out rather than
  // adding it on. `gstRatePercent` is a percentage — 18, not 0.18 — so the fraction is derived
  // here, in the one place that needs it.
  const gstDivisor = 1 + APP_SETTINGS.gstRatePercent / 100;

  const exportCSV = () => {
    const headers = "TransactionID,StudentName,StudentEmail,Course,Amount,Status,Timestamp\n";
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.transactionId}","${r.studentName}","${r.studentEmail}","${r.courseName}","₹${r.amount}","${r.action}","${r.timestamp}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Jarvis_Academy_Enrollments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const query = courseSearch.toLowerCase();
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.techStack.some((t) => t.toLowerCase().includes(query)) ||
      c.topics.some((top) => top.toLowerCase().includes(query));

    const matchesCategory =
      categoryFilter === "all" || c.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // The teacher cell. `course.teacherIds` is only ids, so each one is resolved against the
  // roster for the name and the account for the picture. A course with none says so rather
  // than showing an empty cell, which reads as a rendering fault.
  //
  // Read-only: this used to link to a per-teacher page, which is gone. A teacher is an
  // account, so the place to act on one is the Teachers page.
  const renderTeacherCell = (course: CourseItem) => {
    const assigned = (course.teacherIds ?? [])
      .map((id) => {
        const user = studentsById.get(id);
        if (!user) return null;
        return {
          id,
          name: user.name || "Unnamed",
          email: user.email,
          picture: user.picture,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    if (assigned.length === 0) {
      return <span className="text-[11px] text-neutral-400">Unassigned</span>;
    }

    const [first, ...rest] = assigned;

    return (
      <div className="flex items-center gap-2.5">
        <div className="flex -space-x-2 shrink-0">
          {assigned.slice(0, 3).map((teacher) => (
            <span key={teacher.id} title={teacher.name} className="rounded-full">
              <UserAvatar user={teacher} size="sm" />
            </span>
          ))}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-neutral-900 dark:text-white truncate">
            {first.name}
          </span>
          {rest.length > 0 && (
            <span className="text-[10px] text-neutral-500">+{rest.length} more</span>
          )}
        </div>
      </div>
    );
  };

  // Open modal for new course
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormId("");
    setFormNumber(String(courses.length + 1).padStart(2, "0"));
    setFormTitle("");
    setFormBannerTitle("");
    setFormBannerSubtitle("");
    setFormDescription("");
    setFormCategory("web");
    setFormCategoryLabel("Web & Full-Stack");
    setFormBadge("");
    setFormBadgeType("");
    setFormDuration("60 Days (2 Months)");
    setFormLevel("Beginner to Adv");
    setFormFee("₹30,000");
    setFormAmount(30000);
    setFormTechStack("Next.js, React, FastAPI, Python, PostgreSQL");
    setFormTechIcons("nextjs, react, fastapi, python, postgresql");
    setFormTopics("Module 1: Architecture\nModule 2: Real-time APIs\nModule 3: Cloud Deployment");
    setFormActionPrompt("");
    setFormStatus("active");
    setFormTeacherIds([]);
    setIsModalOpen(true);
  };

  // Open modal for editing existing course
  const handleOpenEdit = (course: CourseItem) => {
    setEditingCourse(course);
    setFormId(course.id);
    setFormNumber(course.number || "");
    setFormTitle(course.title);
    setFormBannerTitle(course.bannerTitle || course.title);
    setFormBannerSubtitle(course.bannerSubtitle || "");
    setFormDescription(course.description || "");
    setFormCategory(course.category);
    setFormCategoryLabel(course.categoryLabel || "Specialized Program");
    setFormBadge(course.badge || "");
    setFormBadgeType(course.badgeType || "");
    setFormDuration(course.duration || "60 Days");
    setFormLevel(course.level || "Beginner to Adv");
    setFormFee(course.fee || "₹30,000");
    setFormAmount(course.amount ?? 30000);
    setFormTechStack((course.techStack || []).join(", "));
    setFormTechIcons((course.techIcons || []).join(", "));
    setFormTopics((course.topics || []).join("\n"));
    setFormActionPrompt(course.actionPrompt || `Tell me about the ${course.title} course`);
    setFormStatus(course.status ?? "active");
    setFormTeacherIds(course.teacherIds ?? []);
    setIsModalOpen(true);
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

      if (editingCourse) {
        await editCourse(editingCourse.id, {
          number: formNumber.trim() || editingCourse.number,
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
            formActionPrompt.trim() || `Tell me about the ${formTitle.trim()} course`,
          status: formStatus,
          teacherIds: formTeacherIds,
        });
        showToast(`Course "${formTitle}" updated successfully!`, "success");
      } else {
        await addCourse({
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
            formActionPrompt.trim() || `Tell me about the ${formTitle.trim()} course`,
          status: formStatus,
          teacherIds: formTeacherIds,
        });
        showToast(`New course "${formTitle}" created successfully!`, "success");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save course";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async (courseId: string) => {
    try {
      await removeCourse(courseId);
      setDeleteConfirmId(null);
      showToast("Course deleted successfully", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete course";
      showToast(msg, "error");
    }
  };

  // A candidate's status cell. Three states in two controls, and only an admin can move them:
  // the `users` rule pins both fields to their stored values for a self-write, so a banned
  // candidate cannot clear their own ban.
  //
  // A ban is not the same thing as an inactivity, so it is not the same click. While banned the
  // switch is disabled and reads "Banned" — a block a stray flick could lift would be no block
  // at all — and Unban is the way back.
  const renderCandidateStatus = (student: StudentRecord) => {
    const isBanned = student.status === "banned";
    // Absent means active. The sign-in upsert deliberately never writes `status`, so treating a
    // missing one as anything but active would paint the whole roster red.
    const isActive = (student.status ?? "active") === "active";
    const busy = busyCandidateId === student.id;
    const who = student.name || student.email;

    return (
      <div className="flex items-center gap-3">
        <StatusSwitch
          checked={isActive}
          offLabel={isBanned ? "Banned" : "Inactive"}
          disabled={busy || isBanned}
          onCheckedChange={(next) => handleCandidateStatus(student.id, next ? "active" : "inactive")}
          label={`Active status for ${who}`}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => handleCandidateStatus(student.id, isBanned ? "active" : "banned")}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
            isBanned
              ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25"
              : "text-neutral-600 dark:text-neutral-300 bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30"
          }`}
        >
          {isBanned ? "Unban" : "Ban"}
        </button>
      </div>
    );
  };

  // The rule itself lives in `src/data/students.ts`, because the sidebar counts people by it
  // too — the number beside a tab and the number of rows behind it have to be the same number.
  const renderRole = (student: StudentRecord) => {
    const { label, icon: Icon, badge } = ROLE_BADGE[accountRoleOf(student)];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge}`}
      >
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // The roster split three ways, one page per role, so every account is listed under the role
  // it holds rather than all of them under a "Students" heading. Built from the same rule the
  // badge reads, so a page holds everybody whose badge names that role, and nobody twice.
  const rosterByRole: Record<AccountRole, StudentRecord[]> = {
    student: [],
    teacher: [],
    admin: [],
  };
  for (const student of students) rosterByRole[accountRoleOf(student)].push(student);

  // The table on its own. The page below supplies the framing around it, so the markup for a
  // row exists once for all three roles.
  const renderRosterTable = (role: AccountRole, empty: string) => {
    const rows = rosterByRole[role];

    // Absent status means active, the same reading the status switch makes — filtering on the
    // stored value alone would drop every account whose sign-in never wrote one.
    const query = rosterQuery.trim().toLowerCase();
    const isFiltered = query !== "" || rosterStatus !== "all";
    const visible = rows.filter((student) => {
      if (rosterStatus !== "all" && (student.status ?? "active") !== rosterStatus) return false;
      if (!query) return true;
      return `${student.name ?? ""} ${student.email ?? ""}`.toLowerCase().includes(query);
    });

    return (
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* The count reads left and the control sits right, the way every other toolbar on the
            dashboard is laid out. The count says what is on screen, so a filtered table cannot
            silently disagree with the number beside it. */}
        <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-white/10">
          <span className="text-[11px] text-neutral-400">
            {isFiltered
              ? `${visible.length} of ${rows.length} shown`
              : `${rows.length} ${rows.length === 1 ? "account" : "accounts"}`}
          </span>

          <Select
            label="Filter accounts by status"
            value={rosterStatus}
            onValueChange={(next) => setRosterStatus(next as "all" | CandidateStatus)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "banned", label: "Banned" },
            ]}
            className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">Account</th>
                <th className="py-3 px-4 sm:px-6">Role</th>
                <th className="py-3 px-4 sm:px-6">Plan</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                <th className="py-3 px-4 sm:px-6">Super10</th>
                <th className="py-3 px-4 sm:px-6">Teacher</th>
                <th className="py-3 px-4 sm:px-6">Last Sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-400">
                    {/* An empty table and a filtered-away table are different facts, so they
                        do not get the same sentence. */}
                    {isFiltered ? "No accounts match these filters." : empty}
                  </td>
                </tr>
              ) : (
                visible.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={student} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-neutral-900 dark:text-white truncate">
                            {student.name || "—"}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate">
                            {student.email}
                          </span>
                          {/* The rest of what the Gmail account gave us. Storing it
                              is only worth anything if an admin can read it. */}
                          <span className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                            {student.signInProvider && <span>{student.signInProvider}</span>}
                            {student.emailVerified && (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-2.5 h-2.5" />
                                verified
                              </span>
                            )}
                            {student.createdAt && (
                              <span>since {new Date(student.createdAt).getFullYear()}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">{renderRole(student)}</td>

                    <td className="py-3.5 px-4 sm:px-6 text-neutral-600 dark:text-neutral-400">
                      {student.plan || "—"}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">{renderCandidateStatus(student)}</td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <button
                        type="button"
                        disabled={busyCandidateId === student.id}
                        onClick={() => handleToggleSuper10(student.id, student.is_super10 === true)}
                        aria-pressed={student.is_super10 === true}
                        title={
                          student.is_super10
                            ? "Remove the Super10 flag"
                            : "Grant the Super10 flag"
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                          student.is_super10
                            ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                            : "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:text-amber-600 dark:hover:text-amber-400"
                        }`}
                      >
                        <Star
                          className={`w-3 h-3 ${student.is_super10 ? "fill-current" : ""}`}
                        />
                        {student.is_super10 ? "Super10" : "—"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <button
                        type="button"
                        disabled={busyCandidateId === student.id}
                        onClick={() => handleToggleTeacher(student.id, student.is_teacher === true)}
                        aria-pressed={student.is_teacher === true}
                        title={
                          student.is_teacher
                            ? "Remove the faculty mark"
                            : "Mark this account as faculty"
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                          student.is_teacher
                            ? "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30"
                            : "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:text-sky-600 dark:hover:text-sky-400"
                        }`}
                      >
                        <Briefcase className="w-3 h-3" />
                        {student.is_teacher ? "Teacher" : "—"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                      {formatSignIn(student.lastLoginAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // One page per role. The roster loads once for the whole dashboard, so each page states the
  // wait and the failure for itself rather than the three of them sharing a single message.
  const renderRolePage = (role: AccountRole) => {
    const page = ROLE_PAGE[role];

    return (
      <div className="flex flex-col gap-4">
        {/* Search, not create: an account is created by signing in with Google and admin
            access is an email allowlist, so there is nothing this page could create. What an
            admin does here is find one, on a roster that is otherwise a long scroll. */}
        <PageHeader
          crumbs={[{ label: "Home", onSelect: () => setActiveTab("home") }, { label: page.title }]}
          action={
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterQuery}
                onChange={(e) => setRosterQuery(e.target.value)}
                placeholder="Search accounts..."
                aria-label={`Search ${page.title.toLowerCase()}`}
                className="w-36 sm:w-52 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          }
        />

        {studentsError ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-amber-600 dark:text-amber-400">
            Could not load the roster right now.
          </div>
        ) : studentsLoading ? (
          <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs p-8 text-center text-xs text-neutral-400">
            Loading accounts...
          </div>
        ) : (
          renderRosterTable(role, page.empty)
        )}
      </div>
    );
  };

  // The overview. Every figure here is counted from what is stored — the roster and the
  // catalogue — rather than from the browser's own admissions ledger, so Home and the tab a
  // number belongs to can never disagree about it. The one exception is Super10, which is
  // counted from the roster but capped from Settings.
  const renderHome = () => {
    const super10Accounts = students.filter((s) => s.is_super10 === true).length;

    // One card per number, and one shape for all of them: what it counts, the figure, and a
    // line saying exactly what was counted, since "Courses: 12" and "Live Courses: 9" would
    // otherwise be two numbers nobody can reconcile.
    const cards = [
      {
        label: "Accounts",
        icon: Users,
        tint: "text-amber-500",
        value: students.length,
        hint: "every account that has signed in",
      },
      {
        label: "Admins",
        icon: ROLE_BADGE.admin.icon,
        tint: "text-indigo-500",
        value: rosterByRole.admin.length,
        hint: "can open this dashboard",
      },
      {
        label: "Teachers",
        icon: ROLE_BADGE.teacher.icon,
        tint: "text-sky-500",
        value: rosterByRole.teacher.length,
        hint: "marked as faculty",
      },
      {
        label: "Students",
        icon: ROLE_BADGE.student.icon,
        tint: "text-emerald-500",
        value: rosterByRole.student.length,
        hint: "signed in, no other role",
      },
      {
        label: "Super10",
        icon: Star,
        tint: "text-amber-500",
        value: super10Accounts,
        hint: `of the ${super10Seats} seats the academy caps`,
      },
      {
        label: "Courses",
        icon: BookOpen,
        tint: "text-blue-500",
        value: courses.length,
        hint: courses.length > 0 ? "in the stored catalogue" : "nothing stored yet",
      },
      {
        label: "Live Courses",
        icon: CheckCircle2,
        tint: "text-emerald-500",
        // The site's own predicate, not a re-derivation of it: absent status means published,
        // and a count that disagreed with `/courses` would be worse than no count.
        value: courses.filter(isPublic).length,
        hint: "published on the public site",
      },
      {
        label: "Answer Book",
        icon: Layers,
        tint: "text-indigo-500",
        value: Object.keys(academyKnowledge).length,
        hint: "entries the chat can answer from",
      },
    ];

    return (
      <div className="flex flex-col gap-4">
        {/* The root of the trail, so the crumb is this page and there is nothing to step up to. */}
        <PageHeader crumbs={[{ label: "Home" }]} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, icon: Icon, tint, value, hint }) => (
            <div
              key={label}
              className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{label}</span>
                <Icon className={`w-4 h-4 ${tint}`} />
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
              <span className="text-[11px] text-neutral-400">{hint}</span>
            </div>
          ))}
        </div>

        {(studentsLoading || coursesLoading) && (
          <p className="text-[11px] text-neutral-400">Still loading the rest of the roster...</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header */}

      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between px-3 sm:px-6 h-14 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 select-none">
        <div className="flex flex-1 items-center min-w-[40px]">
          {!sidebarOpen && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
              title="Open sidebar (Cmd+B)"
              className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-500 md:hover:text-neutral-900 md:hover:bg-neutral-200/60 md:dark:text-neutral-400 md:dark:hover:text-white md:dark:hover:bg-white/10 shadow-xs md:shadow-none shrink-0"
            >
              <span className="md:hidden flex items-center justify-center">
                <MobileMenuIcon className="w-4 h-4" />
              </span>
              <span className="hidden md:flex items-center justify-center">
                <PanelLeft className="w-4 h-4" />
              </span>
            </button>
          )}
        </div>

        <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white text-center">
          Admin Control Center
        </h1>

        {/* The theme control and the identity live here, as they do in the guest
            header. Both outer groups are flex-1 so the title stays centred whatever
            width the controls take — the old fixed-width spacer only balanced a
            36px button. The identity is repeated from the sidebar footer because
            that footer disappears when the sidebar is collapsed. */}
        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2.5 min-w-[40px]">
          <ThemeSwitcher className="shrink-0" />
          {user && <UserProfile user={user} onLogout={logout} variant="compact" />}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* HOME: the counts */}
        {activeTab === "home" && renderHome()}

        {/* TAB 1: COURSE MANAGEMENT (CRUD) */}
        {activeTab === "courses" && (
          <div className="flex flex-col gap-4">
            {/* No action: the toolbar below already carries Add Course and the search, and a
                second copy up here would be the same button twice. */}
            <PageHeader
              crumbs={[{ label: "Home", onSelect: () => setActiveTab("home") }, { label: "Courses" }]}
                />

            {/* Summary Metrics */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Total Active Courses</span>
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {courses.length} Offerings
                </div>
                <span className="text-[11px] text-neutral-400">
                  {courses.length > 0 ? "Stored in Firestore" : "Nothing stored yet"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Web &amp; Full-Stack</span>
                  <Layers className="w-4 h-4 text-sky-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {courses.filter((c) => c.category === "web").length} Tracks
                </div>
                <span className="text-[11px] text-neutral-400">React, Next.js, Python, Laravel</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>AI &amp; Data Science</span>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {courses.filter((c) => c.category === "ai").length} Tracks
                </div>
                <span className="text-[11px] text-neutral-400">GenAI, Agents, PowerBI, Analytics</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Cloud &amp; Placement</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {courses.filter((c) => c.category === "elite" || c.category === "devops").length} Tracks
                </div>
                <span className="text-[11px] text-neutral-400">Super10 Elite &amp; AWS DevOps</span>
              </div>
            </div> */}

            {/* Courses Toolbar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course title, tech stack, topics..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* The filter sits with the controls on the right rather than beside the search,
                  so the toolbars read the same way: what you are looking at on the left, what
                  narrows it on the right. */}
              <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
                <Select
                  label="Filter by category"
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  options={[
                    { value: "all", label: "All Categories" },
                    { value: "web", label: "Web & Full-Stack" },
                    { value: "ai", label: "AI & Data Science" },
                    { value: "devops", label: "DevOps & Cloud" },
                    { value: "database", label: "Database & Systems" },
                    { value: "elite", label: "Super10 Elite" },
                  ]}
                  className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                />

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Course</span>
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                      <th className="py-3 px-4 sm:px-6 w-16">#</th>
                      <th className="py-3 px-4 sm:px-6">Courses</th>
                      <th className="py-3 px-4 sm:px-6">Category</th>
                      <th className="py-3 px-4 sm:px-6">Teacher</th>
                      <th className="py-3 px-4 sm:px-6">Tech Stack</th>
                      <th className="py-3 px-4 sm:px-6">Duration &amp; Fee</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <tr
                          key={course.id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                        >
                          {/* Order / Number */}
                          <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-neutral-400">
                            {course.number || "—"}
                          </td>

                          {/* Title & Badge */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {course.title}
                              </span>
                              {/* A static pill said nothing on a row that was fine and left the
                                  one hiding a course from the site looking like every other
                                  row. The switch says both, and flips it where it is read. */}
                              <StatusSwitch
                                checked={(course.status ?? "active") === "active"}
                                onCheckedChange={(next) =>
                                  handleCourseStatus(course, next ? "active" : "inactive")
                                }
                                label={`Visibility of ${course.title}`}
                              />
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                              {course.categoryLabel || course.category}
                            </span>
                          </td>

                          {/* Assigned Teacher — the face first, because that is what an admin
                              recognises the row by. */}
                          <td className="py-3.5 px-4 sm:px-6">{renderTeacherCell(course)}</td>

                          {/* Tech Stack */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {course.techIcons && course.techIcons.length > 0
                                ? course.techIcons.slice(0, 4).map((icon) => (
                                    <div
                                      key={icon}
                                      className="p-1 rounded-md bg-neutral-100 dark:bg-white/5"
                                      title={icon}
                                    >
                                      <DevIcon name={icon} size={14} />
                                    </div>
                                  ))
                                : course.techStack.slice(0, 3).map((tech) => (
                                    <span
                                      key={tech}
                                      className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                              {course.techStack.length > 4 && (
                                <span className="text-[10px] text-neutral-400">
                                  +{course.techStack.length - 4}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Duration & Fee */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {course.fee}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                {course.duration}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(course)}
                                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                                title="Edit Course"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {deleteConfirmId === course.id ? (
                                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-500/10 p-1 rounded-lg border border-red-200 dark:border-red-500/30">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-1 text-[10px] text-neutral-500 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(course.id)}
                                  className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Delete Course"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-neutral-400">
                          {/* An empty store and an empty filter read the same in the table and
                              mean opposite things, so they are not given the same sentence. */}
                          {courses.length === 0
                            ? "No courses are stored yet. Add one here, or seed the catalogue."
                            : "No courses found matching your criteria."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS & ADMISSIONS */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-4">
            <PageHeader
              crumbs={[
                { label: "Home", onSelect: () => setActiveTab("home") },
                // Named for the tab that opens it, not for the heading the banner used to carry.
                { label: "Users & Admissions" },
              ]}
                />

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
                <span className="text-xs text-neutral-500">Confirmed Admissions</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalPaidStudents}
                </span>
                <span className="text-[11px] text-neutral-400">Paid and active in batches</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
                <span className="text-xs text-neutral-500">Pending Checkout</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {records.filter((r) => r.action !== "paid").length}
                </span>
                <span className="text-[11px] text-neutral-400">Awaiting UPI / card confirmation</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-1.5">
                <span className="text-xs text-neutral-500">Super10 Placement Candidates</span>
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {super10Count} / 10
                </span>
                <span className="text-[11px] text-neutral-400">{10 - super10Count} seats remaining</span>
              </div>
            </div>

            {/* Admissions Table Section */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Admissions Ledger
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    All student registrations, transaction codes, and payment verification.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student or txn..."
                      className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <Select
                    label="Filter by status"
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    options={[
                      { value: "all", label: "All Status" },
                      { value: "paid", label: "Paid (Enrolled)" },
                      { value: "pending", label: "Pending" },
                    ]}
                    className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs"
                  />

                  <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                      <th className="py-3 px-4 sm:px-6">Student Learner</th>
                      <th className="py-3 px-4 sm:px-6">Enrolled Program</th>
                      <th className="py-3 px-4 sm:px-6">Transaction ID</th>
                      <th className="py-3 px-4 sm:px-6">Amount</th>
                      <th className="py-3 px-4 sm:px-6">Status</th>
                      <th className="py-3 px-4 sm:px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((rec, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {rec.studentName}
                              </span>
                              <span className="text-[11px] text-neutral-500">
                                {rec.studentEmail}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {rec.courseName}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                            {rec.transactionId}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 dark:text-white">
                            ₹{(rec.amount || 0).toLocaleString("en-IN")}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6">
                            {rec.action === "paid" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                            {rec.timestamp}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-400">
                          No enrollment records found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Who has an account, as distinct from who has paid for something, is its own
                page per role — see the Students, Admins and Teachers tabs. Every row here
                is a Google sign-in (`upsertStudentRecord` writes one doc per account on
                auth state change), so a learner can appear there having never enrolled,
                and that is the point of those lists. */}
          </div>
        )}

        {/* ONE PAGE PER ROLE. The three together list every account exactly once, because
            `accountRoleOf` gives each account the strongest role it holds. */}
        {activeTab === "students" && renderRolePage("student")}
        {activeTab === "admins" && renderRolePage("admin")}
        {activeTab === "teachers" && renderRolePage("teacher")}

        {/* ANSWER BOOK — what the assistant replies with, read-only */}
        {activeTab === "knowledge" && (
          <AdminKnowledge onHome={() => setActiveTab("home")} />
        )}

        {/* REVENUE & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-4">
            <PageHeader
              crumbs={[
                { label: "Home", onSelect: () => setActiveTab("home") },
                { label: "Revenue & Analytics" },
              ]}
                />

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Gross Admissions Revenue
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ₹{totalPaidRevenue.toLocaleString("en-IN")}
                  </span>
                  {/* No growth figure here. There is no prior period stored to compare
                      against, and the "+100%" that used to sit in this slot was typed into
                      the JSX — it read the same whether revenue rose or fell to zero. */}
                </div>
                <span className="text-[11px] text-neutral-500">
                  Incl. {APP_SETTINGS.gstRatePercent}% statutory GST
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Confirmed Learners
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {totalPaidStudents}
                  </span>
                  <span className="text-xs text-neutral-500">Active enrollments</span>
                </div>
                <span className="text-[11px] text-neutral-500">Across Full-Stack &amp; Super10</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Super10 Seats Filled
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {super10Count} / {super10Seats}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {Math.max(super10Seats - super10Count, 0)} seats left
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">Placement assurance track</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Referral Payout Pool
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ₹{(totalPaidStudents * referralReward).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    ₹{referralReward / 1000}K / student
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">Upon 60-day completion</span>
              </div>
            </div>

            {/* Financial Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Statutory Tax Breakdown
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Gross Invoiced:</span>
                    <span className="font-semibold">₹{totalPaidRevenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Net Academy Revenue (excl. GST):</span>
                    <span className="font-semibold">
                      ₹{Math.round(totalPaidRevenue / gstDivisor).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">
                      {APP_SETTINGS.gstRatePercent}% Statutory GST:
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ₹{Math.round(totalPaidRevenue - totalPaidRevenue / gstDivisor).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Program Metrics
                </h4>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Full-Stack AI Engineering Program:</span>
                    <span className="font-semibold">
                      {records.filter((r) => r.courseId === "fullstack" && r.action === "paid").length} Students
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500">Super10 Placement Assurance Batch:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {super10Count} of {super10Seats} seats
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Avg Invoiced Ticket:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{totalPaidStudents > 0 ? Math.round(totalPaidRevenue / totalPaidStudents).toLocaleString("en-IN") : "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ADD / EDIT COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-y-auto p-6 flex flex-col gap-5 text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="text-base sm:text-lg font-bold">
                  {editingCourse ? "Edit Course" : "Create New Course"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
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
                    disabled={!!editingCourse}
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
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Level
                  </label>
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
                    onValueChange={(value) =>
                      setFormBadgeType(value as CourseItem["badgeType"] | "")
                    }
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
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Status
                  </label>
                  <StatusSwitch
                    checked={formStatus === "active"}
                    onCheckedChange={(next) => setFormStatus(next ? "active" : "inactive")}
                    label="Course status"
                  />
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Active lists it publicly; inactive hides it from the catalogue, the sitemap
                    and /llms.txt, and its page 404s.
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

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  <span>{isSaving ? "Saving..." : editingCourse ? "Save Changes" : "Create Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
