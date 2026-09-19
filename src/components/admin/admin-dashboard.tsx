"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  IndianRupee,
  GraduationCap,
  TrendingUp,
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
  RotateCcw,
  AlertCircle,
  Cloud,
  Check,
  PanelLeft,
} from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { firebaseConfig } from "@/lib/firebase";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { CourseItem, COURSE_CATEGORIES, CourseCategoryId } from "@/data/courses";
import { DevIcon } from "@/components/ui/dev-icon";
import { useToast } from "@/components/ui/toast";

import { DashboardTab } from "@/components/layout/dashboard-sidebar-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { AdminAssignments } from "@/components/admin/admin-assignments";
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

interface AdminDashboardProps {
  onBackToChat: () => void;
  activeTab?: DashboardTab;
  onChangeTab?: (tab: DashboardTab) => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const DEFAULT_RECORDS: EnrollmentRecord[] = [
  {
    action: "paid",
    courseId: "super10",
    courseName: "Super10 Elite Program (100% Placement Assurance)",
    amount: 0,
    transactionId: "TXN-JARVIS-918231",
    studentName: "Sugatraj Sarwade",
    studentEmail: "sugat@jarvisaiacademy.com",
    timestamp: "12 Sep 2026, 04:30 PM",
  },
  {
    action: "paid",
    courseId: "fullstack",
    courseName: "Full-Stack AI & Web Engineering Program",
    amount: 0,
    transactionId: "TXN-JARVIS-847291",
    studentName: "Aditya Verma",
    studentEmail: "aditya.v@example.com",
    timestamp: "11 Sep 2026, 02:15 PM",
  },
  {
    action: "paid",
    courseId: "fullstack",
    courseName: "Full-Stack AI & Web Engineering Program",
    amount: 0,
    transactionId: "TXN-JARVIS-762910",
    studentName: "Pooja Sharma",
    studentEmail: "pooja.sharma@example.com",
    timestamp: "10 Sep 2026, 11:45 AM",
  },
  {
    action: "pending",
    courseId: "super10",
    courseName: "Super10 Elite Program",
    amount: 0,
    transactionId: "TXN-JARVIS-PENDING",
    studentName: "Rohan Kulkarni",
    studentEmail: "rohan.k@example.com",
    timestamp: "09 Sep 2026, 06:10 PM",
  },
];

export function AdminDashboard({
  onBackToChat,
  activeTab: controlledTab,
  onChangeTab,
  sidebarOpen = true,
  onToggleSidebar,
}: AdminDashboardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    courses,
    isLiveFromFirebase,
    loading: coursesLoading,
    addCourse,
    editCourse,
    removeCourse,
    seedCourses,
    resetToDefaults,
  } = useCourses();

  const [localTab, setLocalTab] = useState<DashboardTab>("courses");
  const activeTab: DashboardTab = controlledTab || localTab;
  const setActiveTab = (tab: DashboardTab) => {
    setLocalTab(tab);
    onChangeTab?.(tab);
  };

  // Admissions state
  const [records, setRecords] = useState<EnrollmentRecord[]>(DEFAULT_RECORDS);
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jarvis_enrollment_tracker");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenTxns = new Set(parsed.map((p) => p.transactionId));
          const merged = [
            ...parsed,
            ...DEFAULT_RECORDS.filter((r) => !seenTxns.has(r.transactionId)),
          ];
          setRecords(merged);
        }
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

  // Seed / Reset Courses to Default
  const handleSeedCourses = async () => {
    if (!confirm("Feed and sync the 12 verified courses into Firebase Firestore & local storage?")) {
      return;
    }
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

        {/* The theme control lives here, as it does in the guest header. Both outer
            groups are flex-1 so the title stays centred whatever width the control
            takes — the old fixed-width spacer only balanced a 36px button. */}
        <div className="flex flex-1 items-center justify-end min-w-[40px]">
          <ThemeSwitcher className="shrink-0" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-500/20 shadow-xs">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              Welcome back, {user?.name?.split(" ")[0] || "Director"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              Real-time admissions, revenue analytics, and student management for {siteConfig.name}.
            </p>
          </div>
        </div>

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

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="web">Web &amp; Full-Stack</option>
                  <option value="ai">AI &amp; Data Science</option>
                  <option value="devops">DevOps &amp; Cloud</option>
                  <option value="database">Database &amp; Systems</option>
                  <option value="elite">Super10 Elite</option>
                </select>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={handleSeedCourses}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Feed verified courses into Firebase and reset local catalog"
                >
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isSeeding ? "Feeding..." : "Feed 12 Verified Courses"}</span>
                </button>

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
          </div>
        )}

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
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
                  </span>
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
                    {super10Count} / 10
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {10 - super10Count} seats left
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
                    ₹{(totalPaidStudents * 3000).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">₹3K / student</span>
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
                      {super10Count} Students ({super10Count * 10}% Capped)
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
        {activeTab === "cloud" && (
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
                    Local Storage Active
                  </span>
                )}
              </div>
            </div>

            {/* Cloud Configuration Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-neutral-500">Firebase Project ID</span>
                <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {firebaseConfig.projectId || "Not configured"}
                </span>
                <span className="text-[11px] text-neutral-400">Firestore Cloud Database</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-neutral-500">Firestore Target Collection</span>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  &quot;courses&quot;
                </span>
                <span className="text-[11px] text-neutral-400">{courses.length} courses loaded</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-neutral-500">CLI Seeder Command</span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-neutral-100 dark:bg-white/5 px-2 py-1 rounded">
                  pnpm seed:courses
                </span>
                <span className="text-[11px] text-neutral-400">or node scripts/seed-courses.mjs</span>
              </div>
            </div>

            {/* Actions Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-4">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Course Catalog Seeding &amp; Recovery
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                You can feed the complete 12 verified courses into Cloud Firestore with one click.
                If Cloud Firestore is enabled in your Firebase console, the courses are permanently saved in the cloud. If Firestore is offline, courses are safely preserved in local storage.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={handleSeedCourses}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>{isSeeding ? "Feeding..." : "Feed 12 Verified Courses to Firestore"}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Reset catalog back to the initial 12 course default state?")) {
                      await resetToDefaults();
                      showToast("Catalog reset to defaults", "info");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Reset to Factory Defaults</span>
                </button>
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
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as CourseItem["category"];
                      setFormCategory(cat);
                      if (cat === "web") setFormCategoryLabel("Web & Full-Stack");
                      else if (cat === "ai") setFormCategoryLabel("AI & Data Science");
                      else if (cat === "devops") setFormCategoryLabel("DevOps & Cloud");
                      else if (cat === "database") setFormCategoryLabel("Database & Systems");
                      else if (cat === "elite") setFormCategoryLabel("Super10 Elite");
                    }}
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <option value="web">Web &amp; Full-Stack</option>
                    <option value="ai">AI &amp; Data Science</option>
                    <option value="devops">DevOps &amp; Cloud</option>
                    <option value="database">Database &amp; Systems</option>
                    <option value="elite">Super10 Elite</option>
                  </select>
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
                  <select
                    value={formBadgeType}
                    onChange={(e) => setFormBadgeType(e.target.value as CourseItem["badgeType"])}
                    className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white cursor-pointer"
                  >
                    <option value="">None</option>
                    <option value="bestseller">Bestseller (Cyan/Blue)</option>
                    <option value="elite">Elite (Gold/Amber)</option>
                    <option value="popular">Popular (Indigo/Purple)</option>
                    <option value="ai">AI Special (Violet/Magenta)</option>
                  </select>
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
