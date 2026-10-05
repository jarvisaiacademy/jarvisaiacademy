"use client";

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Users, Copy, CheckCircle2, Sparkles, Filter } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { SettingsSection } from "@/components/settings/settings-section";
import { referralCodeFor } from "@/data/referrals";

export type ReferralCandidateStatus =
  | "Enquery"
  | "Admission Completed"
  | "Course Ongoing"
  | "Course Completed";

export interface ReferredCandidate {
  id: string;
  name: string;
  course: string;
  date: string;
  status: ReferralCandidateStatus;
}

const STATUS_CONFIG: Record<
  ReferralCandidateStatus,
  {
    step: number;
    badgeClass: string;
    dotClass: string;
    description: string;
  }
> = {
  "Enquery": {
    step: 1,
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30",
    dotClass: "bg-amber-500",
    description: "Initial lead / enquiry",
  },
  "Admission Completed": {
    step: 2,
    badgeClass:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30",
    dotClass: "bg-blue-500",
    description: "Admitted & tuition confirmed",
  },
  "Course Ongoing": {
    step: 3,
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30",
    dotClass: "bg-indigo-500",
    description: "Active coursework in progress",
  },
  "Course Completed": {
    step: 4,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    dotClass: "bg-emerald-500",
    description: "Graduated & reward unlocked",
  },
};

const ALL_STATUSES: ReferralCandidateStatus[] = [
  "Enquery",
  "Admission Completed",
  "Course Ongoing",
  "Course Completed",
];

// Candidates representing the 4 referral pipeline stages
const MOCK_REFERRED_USERS: ReferredCandidate[] = [
  {
    id: "1",
    name: "Alice Sharma",
    course: "AI Mastery & LLMs Track",
    date: "4 October 2026",
    status: "Admission Completed",
  },
  {
    id: "2",
    name: "Rahul Gupta",
    course: "Full Stack AI Developer",
    date: "5 October 2026",
    status: "Enquery",
  },
  {
    id: "3",
    name: "Priya Desai",
    course: "Super10 AI Elite Track",
    date: "28 September 2026",
    status: "Course Ongoing",
  },
  {
    id: "4",
    name: "Vikram Malhotra",
    course: "Agentic AI Specialist",
    date: "15 September 2026",
    status: "Course Completed",
  },
];

export function DashboardReferrals() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const referralCode =
    user?.referralCode && /^[A-Z0-9]{6}$/.test(user.referralCode)
      ? user.referralCode
      : user?.id
      ? referralCodeFor(user.id)
      : "JARVIS";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = useMemo(() => {
    if (selectedFilter === "All") return MOCK_REFERRED_USERS;
    return MOCK_REFERRED_USERS.filter((u) => u.status === selectedFilter);
  }, [selectedFilter]);

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
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Referral</h2>
          <p className="text-sm text-muted-foreground">
            Share your unique 6-digit code to invite candidates and monitor their referral status.
          </p>
        </div>

        {/* Code Display Section */}
        <SettingsSection title="Your Referral Code" className="w-full">
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border border-border bg-card/50 rounded-2xl w-full shadow-xs">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Code
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-foreground font-mono">
                {referralCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </SettingsSection>

        {/* Referral Pipeline Stages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          {ALL_STATUSES.map((status) => {
            const count = MOCK_REFERRED_USERS.filter((u) => u.status === status).length;
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
          title={`Referred Candidates (${filteredUsers.length}${selectedFilter !== "All" ? ` of ${MOCK_REFERRED_USERS.length}` : ""})`}
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
              All ({MOCK_REFERRED_USERS.length})
            </button>
            {ALL_STATUSES.map((status) => {
              const count = MOCK_REFERRED_USERS.filter((u) => u.status === status).length;
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
                const config = STATUS_CONFIG[person.status];
                const initials = person.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={person.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 sm:px-8 py-4 sm:py-4.5 hover:bg-muted/40 transition-colors ${
                      index !== filteredUsers.length - 1 ? "border-b border-border/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground font-semibold text-xs shrink-0 ring-1 ring-border">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                          {person.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{person.course}</span>
                          <span>·</span>
                          <span>{person.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-13 sm:pl-0">
                      <span
                        className={`text-[10px] sm:text-xs font-semibold tracking-wide uppercase px-3 py-1 rounded-full ${config.badgeClass}`}
                      >
                        {person.status}
                      </span>
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
