"use client";

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Users,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { SettingsSection } from "@/components/settings/settings-section";
import { referralCodeFor, resolvedReferralCode } from "@/data/referrals";
import {
  useStudentReferrals,
  type ReferralCandidateStatus,
  type ReferredCandidate,
  ALL_REFERRAL_STATUSES,
  STATUS_CONFIG,
} from "@/hooks/use-student-referrals";

export type { ReferralCandidateStatus, ReferredCandidate };

export function DashboardReferrals() {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.id);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const referralCode =
    resolvedReferralCode(user?.id, profile?.referralCode || user?.referralCode) || "JARVIS";

  // Dynamic referrals hook connected to Firestore and persistent storage
  const { candidates, loading, updateCandidateStatus } = useStudentReferrals(
    user?.id,
    referralCode
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Dynamic counts
  const totalCount = candidates.length;
  const enquiryCount = candidates.filter((u) => u.status === "Enquiry").length;
  const admissionCount = candidates.filter((u) => u.status === "Admission Completed").length;
  const ongoingCount = candidates.filter((u) => u.status === "Course Ongoing").length;
  const completedCount = candidates.filter((u) => u.status === "Course Completed").length;

  const filteredUsers = useMemo(() => {
    if (selectedFilter === "All") return candidates;
    return candidates.filter((u) => u.status === selectedFilter);
  }, [selectedFilter, candidates]);

  const getStatusCount = (status: ReferralCandidateStatus) => {
    switch (status) {
      case "Enquiry":
        return enquiryCount;
      case "Admission Completed":
        return admissionCount;
      case "Course Ongoing":
        return ongoingCount;
      case "Course Completed":
        return completedCount;
      default:
        return 0;
    }
  };

  return (
    <div className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-6 w-full"
      >
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Referral</h2>
            {loading && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground animate-pulse">
                Syncing...
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Share your unique referral code to invite candidates and monitor their status in real-time.
          </p>
        </div>

        {/* Code Display Section */}
        <SettingsSection title="Your Referral Code" className="w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 border border-border bg-card/50 rounded-2xl w-full shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Code
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-foreground font-mono">
                {referralCode}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-foreground text-background text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {copiedCode ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Copied Code</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Referral Pipeline Stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {ALL_REFERRAL_STATUSES.map((status) => {
            const count = getStatusCount(status);
            const cfg = STATUS_CONFIG[status];
            const isSelected = selectedFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedFilter(isSelected ? "All" : status)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? "bg-card border-foreground ring-1 ring-foreground shadow-sm"
                    : "bg-card/50 border-border hover:bg-muted/40 hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                    Stage {cfg.step}
                  </span>
                  <span className="text-xs font-bold text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {status}
                  </span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {cfg.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Referred Candidates List */}
        <SettingsSection
          title={`Referred Candidates (${filteredUsers.length}${selectedFilter !== "All" ? ` of ${totalCount}` : ""})`}
          className="w-full"
        >
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 px-6 sm:px-8 pt-4 pb-3 border-b border-border/50 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedFilter("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedFilter === "All"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({totalCount})
            </button>
            {ALL_REFERRAL_STATUSES.map((status) => {
              const count = getStatusCount(status);
              const isSelected = selectedFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-background/20 text-background" : "bg-background text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredUsers.length > 0 ? (
            <div className="flex flex-col">
              {filteredUsers.map((person, index) => {
                const initials = person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={person.id}
                    className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-6 sm:px-8 py-4 sm:py-4.5 hover:bg-muted/30 transition-colors ${
                      index !== filteredUsers.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    {/* Left: Avatar + Candidate Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground font-semibold text-xs shrink-0 ring-1 ring-border">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                            {person.name}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 hidden sm:inline-block">
                            {person.course}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="sm:hidden truncate">{person.course} · </span>
                          <span>Referred on {person.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: The 4 Statuses in a Horizontal Line at the side of the name */}
                    <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0 pl-13.5 lg:pl-0">
                      {ALL_REFERRAL_STATUSES.map((status, sIdx) => {
                        const isActive = person.status === status;
                        const cfg = STATUS_CONFIG[status];
                        return (
                          <React.Fragment key={status}>
                            <button
                              type="button"
                              onClick={() => updateCandidateStatus(person.id, status)}
                              title={`Set status to "${status}"`}
                              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer ${
                                isActive
                                  ? `${cfg.badgeClass} ring-1 font-semibold shadow-xs`
                                  : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 dark:text-neutral-500 border border-neutral-200/60 dark:border-white/5 hover:text-neutral-600 dark:hover:text-neutral-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                  isActive
                                    ? cfg.dotClass
                                    : "bg-neutral-300 dark:bg-neutral-600"
                                }`}
                              />
                              <span>{status}</span>
                            </button>

                            {sIdx < ALL_REFERRAL_STATUSES.length - 1 && (
                              <div
                                className="h-0.5 w-2 sm:w-3 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800"
                                aria-hidden="true"
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">
                No candidates in &ldquo;{selectedFilter}&rdquo; status
              </p>
              <button
                type="button"
                onClick={() => setSelectedFilter("All")}
                className="mt-3 px-4 py-1.5 rounded-xl bg-muted text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </SettingsSection>
      </motion.div>
    </div>
  );
}
