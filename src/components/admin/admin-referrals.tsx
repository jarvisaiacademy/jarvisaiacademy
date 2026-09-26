"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from "lucide-react";
import { useStudents } from "@/providers/students-provider";
import { useToast } from "@/components/ui/toast";
import { referredUsers, type StudentRecord } from "@/data/students";
import { TablePagination } from "@/components/ui/table-pagination";
import { DEFAULT_PAGE_SIZE, type PageSize } from "@/services/pagination";

interface AdminReferralsProps {
  onHome: () => void;
}

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "—";
  return when.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminReferrals({ onHome }: AdminReferralsProps) {
  const { students, loading, refreshStudents } = useStudents();
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  // Resolved from roster
  const byId = useMemo(
    () => new Map<string, StudentRecord>(students.map((student) => [student.id, student])),
    [students]
  );

  const rawEvents = useMemo(() => referredUsers(students), [students]);

  // Filtered referrals
  const filteredEvents = useMemo(() => {
    let result = rawEvents;

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((learner) => {
        const referrer = learner.referredBy ? byId.get(learner.referredBy) : undefined;
        const nameMatch = (learner.name || "").toLowerCase().includes(q);
        const emailMatch = (learner.email || "").toLowerCase().includes(q);
        const codeMatch = (learner.referredByCode || "").toLowerCase().includes(q);
        const referrerNameMatch = (referrer?.name || "").toLowerCase().includes(q);
        const referrerEmailMatch = (referrer?.email || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || codeMatch || referrerNameMatch || referrerEmailMatch;
      });
    }

    return [...result].sort((a, b) => (b.referredAt ?? "").localeCompare(a.referredAt ?? ""));
  }, [rawEvents, searchQuery, byId]);

  // Paged slice
  const pagedEvents = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // Reset page when search changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(0);
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStudents();
      showToast("Referrals directory refreshed", "success");
    } catch {
      showToast("Failed to refresh referrals directory", "error");
    } finally {
      setIsRefreshing(false);
    }
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
          Referrals
        </span>
      </nav>

      {/* Big Referral List Card */}
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
                Referrals
              </h2>
              <button
                type="button"
                disabled={isRefreshing || loading}
                onClick={handleRefresh}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Referrals Directory"
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
                {filteredEvents.length}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Referrals
              </span>
            </div>

            {/* Right side: Search bar */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search learner, code or referrer..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10 font-medium">
                <th className="py-3 px-4 sm:px-6">New Learner</th>
                <th className="py-3 px-4 sm:px-6">Code Used</th>
                <th className="py-3 px-4 sm:px-6">Referred By</th>
                <th className="py-3 px-4 sm:px-6">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-neutral-400 animate-pulse">
                    Loading referrals roster...
                  </td>
                </tr>
              ) : pagedEvents.length > 0 ? (
                pagedEvents.map((learner) => {
                  const referrer = learner.referredBy ? byId.get(learner.referredBy) : undefined;
                  return (
                    <tr
                      key={learner.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {learner.name || "Unnamed Student"}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            {learner.email || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                        {learner.referredByCode ?? "—"}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {referrer?.name ?? "Account no longer on roster"}
                          </span>
                          {referrer?.email && (
                            <span className="text-[11px] text-neutral-500">{referrer.email}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-neutral-500 text-[11px]">
                        {formatWhen(learner.referredAt)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-neutral-400">
                    No referrals found matching your query.
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
          total={filteredEvents.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(0);
          }}
          noun="referrals"
        />
      </div>
    </div>
  );
}

export default AdminReferrals;
