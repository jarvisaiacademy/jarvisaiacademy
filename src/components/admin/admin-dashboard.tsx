"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Filter,
  Plus,
  Pencil,
  Trash2,
  Database,
  Sparkles,
  BookOpen,
  Layers,
  X,
  AlertCircle,
  Cloud,
  Check,
  PanelLeft,
  Star,
} from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { siteConfig } from "@/config/site";
import { useCourses } from "@/providers/courses-provider";
import { useStudents } from "@/providers/students-provider";
import { useTeachers } from "@/providers/teachers-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateCandidateInFirestore } from "@/services/students-service";
import { CandidateStatus } from "@/data/assignments";
import { CourseItem, COURSE_CATEGORIES, CourseCategoryId, CourseStatus } from "@/data/courses";
import { DevIcon } from "@/components/ui/dev-icon";
import { useToast } from "@/components/ui/toast";

import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { UserProfile } from "@/components/layout/user-profile";
import { useAuth } from "@/providers/auth-provider";
import { AdminAssignments } from "@/components/admin/admin-assignments";
import { AdminTeachers } from "@/components/admin/admin-teachers";
import { AdminKnowledge } from "@/components/admin/admin-knowledge";
import { Select } from "@/components/ui/select";
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

interface AdminDashboardProps {
  onBackToChat: () => void;
  activeTab?: DashboardTab;
  onChangeTab?: (tab: DashboardTab) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function AdminDashboard({
  onBackToChat,
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
  const {
    courses,
    isLiveFromFirebase,
    loading: coursesLoading,
    addCourse,
    editCourse,
    removeCourse,
    seedCourses,
  } = useCourses();
  const { teachers } = useTeachers();
  const { user } = useAuth();

  // Seeding overwrites the live catalogue from the built-in one, which is a development
  // action, not something to leave armed on the deployed site. `next dev` is the only
  // context where this is true; Netlify builds with NODE_ENV=production.
  const canSeed = process.env.NODE_ENV === "development";

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
  const [isSeeding, setIsSeeding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [seedConfirm, setSeedConfirm] = useState(false);

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

  // The referral reward the academy advertises, and the seat count the Super10 track is
  // capped at. Both are named because they were bare numbers in the JSX: a 3000 next to a
  // rupee sign is not an arithmetic error waiting to happen, it is one already happening,
  // since nothing tied it to the figure the answer book quotes.
  const REFERRAL_REWARD = 3000;
  const SUPER10_SEATS = 10;

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

  // Seed the built-in course catalogue into Firestore
  const handleSeedCourses = async () => {
    setSeedConfirm(false);
    setIsSeeding(true);
    try {
      const res = await seedCourses();
      showToast(`Successfully seeded ${res.count} courses!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed courses";
      showToast(msg, "error");
    } finally {
      setIsSeeding(false);
    }
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
        {/* TAB 1: COURSE MANAGEMENT (CRUD) */}
        {activeTab === "courses" && (
          <div className="flex flex-col gap-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Total Active Courses</span>
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {courses.length} Offerings
                </div>
                <span className="text-[11px] text-neutral-400">
                  Synchronized across chat and catalog
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
            </div>

            {/* Courses Toolbar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-3">
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
              </div>

              <div className="flex items-center gap-2 self-end lg:self-auto">
                {canSeed && (
                  <>
                    {seedConfirm ? (
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 p-1 rounded-lg border border-blue-200 dark:border-blue-500/30">
                        <button
                          type="button"
                          onClick={handleSeedCourses}
                          className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded cursor-pointer"
                          title="Feed the 12 built-in verified courses into Firestore"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setSeedConfirm(false)}
                          className="px-1 text-[10px] text-neutral-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSeeding}
                        onClick={() => setSeedConfirm(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        title="Feed the built-in verified courses into Firestore"
                      >
                        <Database className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isSeeding ? "Feeding..." : "Feed 12 Verified Courses"}</span>
                      </button>
                    )}
                  </>
                )}

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
                      <th className="py-3 px-4 sm:px-6">Course Offering</th>
                      <th className="py-3 px-4 sm:px-6">Category</th>
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
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900 dark:text-white">
                                  {course.title}
                                </span>
                                {course.badge && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                    {course.badge}
                                  </span>
                                )}
                                {/* Absent means active, so only the exception is worth
                                    a badge — a row of "Active" pills says nothing. */}
                                {(course.status ?? "active") === "inactive" && (
                                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 border border-neutral-300 dark:border-white/10">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-500 font-mono">
                                id: {course.id}
                              </span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                              {course.categoryLabel || course.category}
                            </span>
                          </td>

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
                        <td colSpan={6} className="text-center py-10 text-neutral-400">
                          No courses found matching your criteria.
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
          <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 border border-emerald-500/20 shadow-xs">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Learners &amp; Student Admissions
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Manage enrolled candidates, transaction IDs, payment verification, and program access.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {totalPaidStudents} Enrolled Learners
                </span>
              </div>
            </div>

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

            {/* Who has an account, as distinct from who has paid for something. Every
                row here is a Google sign-in — `upsertStudentRecord` writes one doc per
                account on auth state change — so a learner can appear here having never
                enrolled, and that is the point of the list. */}
            <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Registered Students
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Accounts created by signing in with Google.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 text-xs font-medium self-start sm:self-auto">
                  <Users className="w-3.5 h-3.5" />
                  {students.length} {students.length === 1 ? "Account" : "Accounts"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                      <th className="py-3 px-4 sm:px-6">Student Learner</th>
                      <th className="py-3 px-4 sm:px-6">Role</th>
                      <th className="py-3 px-4 sm:px-6">Plan</th>
                      <th className="py-3 px-4 sm:px-6">Status</th>
                      <th className="py-3 px-4 sm:px-6">Super10</th>
                      <th className="py-3 px-4 sm:px-6">Last Sign-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                    {studentsLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-400">
                          Loading registered students...
                        </td>
                      </tr>
                    ) : studentsError ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-amber-600 dark:text-amber-400">
                          Could not load the roster right now.
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-400">
                          No accounts yet — nobody has signed in with Google.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              {student.picture ? (
                                <img
                                  src={student.picture}
                                  alt=""
                                  className="w-7 h-7 rounded-full border border-neutral-200 dark:border-white/10 object-cover shrink-0"
                                />
                              ) : (
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-700 text-neutral-200 text-[10px] font-semibold shrink-0">
                                  {(student.name || student.email || "?").slice(0, 2).toUpperCase()}
                                </div>
                              )}
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

                          <td className="py-3.5 px-4 sm:px-6">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                                student.role === "admin"
                                  ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30"
                                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/10"
                              }`}
                            >
                              {student.role === "admin" ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <GraduationCap className="w-3 h-3" />
                              )}
                              {student.role === "admin" ? "Admin" : "Student"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-neutral-600 dark:text-neutral-400">
                            {student.plan || "—"}
                          </td>

                          {/* Three states, and only an admin can move them: the `users`
                              rule pins both fields to their stored values for a self-write,
                              so a banned candidate cannot clear their own ban. */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <Select
                              label={`Status for ${student.name || student.email}`}
                              value={student.status ?? "active"}
                              onValueChange={(next) =>
                                handleCandidateStatus(student.id, next as CandidateStatus)
                              }
                              options={[
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                                { value: "banned", label: "Banned" },
                              ]}
                              className={`py-1 px-2 rounded-lg border text-[11px] ${
                                student.status === "banned"
                                  ? "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30"
                                  : student.status === "inactive"
                                    ? "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-white/10"
                                    : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                              }`}
                            />
                          </td>

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
          </div>
        )}

        {/* TEACHERS MANAGEMENT */}
        {activeTab === "teachers" && <AdminTeachers />}

        {/* ANSWER BOOK — what the assistant replies with, read-only */}
        {activeTab === "knowledge" && <AdminKnowledge />}

        {/* TAB 3: COURSE ASSIGNMENTS */}
        {activeTab === "assignments" && <AdminAssignments />}

        {/* TAB 4: REVENUE & ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-6">
            {/* Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 shadow-xs">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Revenue &amp; Enrollment Analytics
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Comprehensive performance breakdown, gross revenue, and program capacity for {siteConfig.name}.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Ledger
                </span>
              </div>
            </div>

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
                <span className="text-[11px] text-neutral-500">Incl. 18% statutory GST</span>
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
                    {super10Count} / {SUPER10_SEATS}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {Math.max(SUPER10_SEATS - super10Count, 0)} seats left
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
                    ₹{(totalPaidStudents * REFERRAL_REWARD).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    ₹{REFERRAL_REWARD / 1000}K / student
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
                      ₹{Math.round(totalPaidRevenue / 1.18).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">18% Statutory GST:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ₹{Math.round(totalPaidRevenue - totalPaidRevenue / 1.18).toLocaleString("en-IN")}
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
                      {super10Count} of {SUPER10_SEATS} seats
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

        {/* TAB 4: FIREBASE CLOUD SYNC & SEEDER */}
        {activeTab === "cloud" && canSeed && (
          <div className="flex flex-col gap-6">
            {/* Cloud Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10 border border-purple-500/20 shadow-xs">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Google Firebase Firestore &amp; Seeder
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Manage real-time cloud data pipelines, seed initial courses, and monitor collection synchronization.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isLiveFromFirebase ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Firestore Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Built-in Catalog
                  </span>
                )}
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
                  {editingCourse ? "Edit Course Offering" : "Create New Course Offering"}
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
                  <Select
                    label="Course status"
                    value={formStatus}
                    onValueChange={(next) => setFormStatus(next as CourseStatus)}
                    options={[
                      { value: "active", label: "Active — listed publicly" },
                      { value: "inactive", label: "Inactive — hidden everywhere" },
                    ]}
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
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
                    options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white"
                  />
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {teachers.length === 0
                      ? "No teachers yet — add them in the Teachers tab."
                      : formTeacherIds.length === 0
                        ? "No teacher assigned to this course."
                        : formTeacherIds
                            .map((id) => teachers.find((t) => t.id === id)?.name ?? id)
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
