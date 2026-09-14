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
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/providers/auth-provider";
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
}

const DEFAULT_RECORDS: EnrollmentRecord[] = [
  {
    action: "paid",
    courseId: "super10",
    courseName: "Super10 Elite Cohort (100% Placement Assurance)",
    amount: 35400,
    transactionId: "TXN-JARVIS-918231",
    studentName: "Sugatraj Sarwade",
    studentEmail: "sugat@jarvisaiacademy.com",
    timestamp: "12 Sep 2026, 04:30 PM",
  },
  {
    action: "paid",
    courseId: "fullstack",
    courseName: "Full-Stack AI & Web Engineering Cohort",
    amount: 35400,
    transactionId: "TXN-JARVIS-847291",
    studentName: "Aditya Verma",
    studentEmail: "aditya.v@example.com",
    timestamp: "11 Sep 2026, 02:15 PM",
  },
  {
    action: "paid",
    courseId: "fullstack",
    courseName: "Full-Stack AI & Web Engineering Cohort",
    amount: 35400,
    transactionId: "TXN-JARVIS-762910",
    studentName: "Pooja Sharma",
    studentEmail: "pooja.sharma@example.com",
    timestamp: "10 Sep 2026, 11:45 AM",
  },
  {
    action: "initiated",
    courseId: "super10",
    courseName: "Super10 Elite Cohort",
    amount: 35400,
    transactionId: "TXN-JARVIS-PENDING",
    studentName: "Rohan Kulkarni",
    studentEmail: "rohan.k@example.com",
    timestamp: "09 Sep 2026, 06:10 PM",
  },
];

export function AdminDashboard({ onBackToChat }: AdminDashboardProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<EnrollmentRecord[]>(DEFAULT_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jarvis_enrollment_tracker");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with default records, avoiding duplicates
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
    .reduce((acc, curr) => acc + (curr.amount || 35400), 0);

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

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>
          <div className="h-4 w-px bg-neutral-300 dark:bg-white/15" />
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              Admin Control Center
            </h1>
          </div>
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

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
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

          {/* Enrolled Students */}
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

          {/* Super10 Cohort */}
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

          {/* Referral Liability */}
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

        {/* Admissions Table Section */}
        <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-white/10">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Student Admissions &amp; Invoices
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                All checkout reservations, transaction records, and enrollment verification.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search input */}
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

              {/* Status Filter */}
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
            </div>
          </div>

          {/* Table */}
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
                        ₹{(rec.amount || 35400).toLocaleString("en-IN")}
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
      </main>
    </div>
  );
}

export default AdminDashboard;
