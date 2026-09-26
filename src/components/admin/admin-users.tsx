"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Download,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";
import { db } from "@/lib/firebase";

export interface EnrollmentRecord {
  id?: string;
  action: string;
  courseId: string;
  courseName: string;
  amount: number;
  transactionId: string;
  studentName: string;
  studentEmail: string;
  timestamp: string;
}

interface AdminUsersProps {
  onHome: () => void;
  records?: EnrollmentRecord[];
}

export function AdminUsers({ onHome, records: propRecords }: AdminUsersProps) {
  const { showToast } = useToast();
  const [localRecords, setLocalRecords] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(!propRecords);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  // Subscribe to enrollments if propRecords not provided
  useEffect(() => {
    if (propRecords) {
      setLocalRecords(propRecords);
      setLoading(false);
      return;
    }

    let active = true;
    import("firebase/firestore").then(({ collection, onSnapshot, query }) => {
      if (!db || !active) return;
      const q = query(collection(db, "enrollments"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!active) return;
          const fetched = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as unknown as EnrollmentRecord)
          );

          fetched.sort((a, b) => {
            const tA = new Date(a.timestamp).getTime() || 0;
            const tB = new Date(b.timestamp).getTime() || 0;
            return tB - tA;
          });

          setLocalRecords(fetched);
          setLoading(false);
        },
        (err) => {
          console.error("Failed to load admissions records:", err);
          if (active) setLoading(false);
        }
      );

      return () => {
        active = false;
        unsubscribe();
      };
    });
  }, [propRecords]);

  // Use prop records if available, otherwise local records
  const allRecords = propRecords || localRecords;

  // Filter admissions
  const filteredRecords = useMemo(() => {
    let result = allRecords;

    if (statusFilter !== "all") {
      result = result.filter((r) =>
        statusFilter === "paid" ? r.action === "paid" : r.action !== "paid"
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (r) =>
          (r.studentName || "").toLowerCase().includes(q) ||
          (r.studentEmail || "").toLowerCase().includes(q) ||
          (r.courseName || "").toLowerCase().includes(q) ||
          (r.transactionId || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [allRecords, statusFilter, searchQuery]);

  // Paged slice
  const pagedRecords = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(0);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (db) {
        const { collection, getDocs, query } = await import("firebase/firestore");
        const q = query(collection(db, "enrollments"));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(
          (d) =>
            ({
              id: d.id,
              ...d.data(),
            } as unknown as EnrollmentRecord)
        );
        fetched.sort((a, b) => {
          const tA = new Date(a.timestamp).getTime() || 0;
          const tB = new Date(b.timestamp).getTime() || 0;
          return tB - tA;
        });
        setLocalRecords(fetched);
      }
      showToast("Admissions ledger refreshed", "success");
    } catch {
      showToast("Failed to refresh admissions ledger", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export CSV handler
  const exportCSV = () => {
    const headers = "TransactionID,StudentName,StudentEmail,Course,Amount,Status,Timestamp\n";
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.transactionId || ""}","${r.studentName || ""}","${r.studentEmail || ""}","${r.courseName || ""}","₹${r.amount || 0}","${r.action === "paid" ? "Confirmed" : "Pending"}","${r.timestamp || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admissions_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Admissions CSV exported", "success");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Breadcrumb at the top left side outside the list card */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onHome}
          className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900 dark:text-white">
          Users & Admissions
        </span>
      </nav>

      {/* Big Admissions List Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col">
        {/* Inside Card Header Bar */}
        <div className="p-4 sm:p-5 flex flex-col gap-5 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            {/* Back button inside the card */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            </div>

            {/* In the Center: Heading with Refresh icon at its side */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                Users & Admissions
              </h2>
              <button
                type="button"
                disabled={isRefreshing || loading}
                onClick={handleRefresh}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Admissions Ledger"
              >
                <RotateCcw
                  className={`w-4 h-4 ${isRefreshing || loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {/* Right: empty spacer balancing Back button (read-only, no CRUD) */}
            <div className="flex items-center justify-end w-[72px]" />
          </div>

          {/* Search bar at right side & data above label at left side */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
            {/* Left side: count data above label in normal text size */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                {filteredRecords.length}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Admissions
              </span>
            </div>

            {/* Right side: Search bar, Status filter and Export CSV */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search student, course, txn..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <Select
                label="Filter by status"
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "paid", label: "Confirmed" },
                  { value: "pending", label: "Pending" },
                ]}
                className="py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs whitespace-nowrap"
              />

              <button
                type="button"
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                title="Export admissions as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-neutral-400 animate-pulse">
                    Loading admissions ledger...
                  </td>
                </tr>
              ) : pagedRecords.length > 0 ? (
                pagedRecords.map((rec, idx) => (
                  <tr
                    key={rec.id || rec.transactionId || idx}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {rec.studentName || "Unnamed Student"}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {rec.studentEmail || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {rec.courseName || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      {rec.transactionId || "—"}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-neutral-900 dark:text-white">
                      ₹{(rec.amount || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status without badge card - dot indicator only */}
                    <td className="py-3.5 px-4 sm:px-6">
                      {rec.action === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                      {rec.timestamp || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-neutral-400">
                    No enrollment records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(0);
          }}
          noun="records"
        />
      </div>
    </div>
  );
}

export default AdminUsers;
