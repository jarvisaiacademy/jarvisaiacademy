"use client";

import React from "react";
import { motion } from "motion/react";
import { BookOpen, Award, ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudentEnrollments } from "@/hooks/use-student-enrollments";
import { referralCodeFor } from "@/data/referrals";
import { type StudentTab } from "@/components/dashboard/student-shell";

interface DashboardHomeProps {
  onSelectTab: (tab: StudentTab) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-colors">
      <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  const enrollments = useStudentEnrollments(user?.email);

  const firstName = user?.name?.split(" ")[0] || "there";
  const referralCode = user?.referralCode || (user?.id ? referralCodeFor(user.id) : "JARV");
  const joinedYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5"
    >
      {/* Welcome hero — clean, centered, ChatGPT-style */}
      <div className="flex flex-col items-center gap-4 pt-4 pb-2 text-center">
        {/* Avatar */}
        <div className="relative">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-border ring-offset-2 ring-offset-background"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted text-foreground text-lg font-semibold ring-2 ring-border ring-offset-2 ring-offset-background">
              {user?.name?.slice(0, 2).toUpperCase() ?? "JA"}
            </div>
          )}
          {/* online dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>

        {/* Greeting */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Good{" "}
            {(() => {
              const h = new Date().getHours();
              return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
            })()}
            , {firstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Member since {joinedYear} · Jarvis AI Academy
          </p>
        </div>
      </div>

      {/* Thin divider */}
      <hr className="border-border" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={enrollments.length}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={0}
          color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Referral code — slim inline pill */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-muted/40">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Referral Code
          </span>
          <span className="text-base font-mono font-semibold text-foreground tracking-widest">
            {referralCode}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined") {
              navigator.clipboard.writeText(referralCode).catch(() => {});
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          Copy
        </button>
      </div>

      {/* Continue learning */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
          Continue Learning
        </p>
        {enrollments.length > 0 ? (
          <div className="flex flex-col rounded-xl overflow-hidden border border-border divide-y divide-border">
            {enrollments.slice(0, 3).map((record) => (
              <div
                key={`${record.transactionId}-${record.timestamp}`}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-card hover:bg-muted/40 transition-colors"
              >
                <span className="text-sm font-medium text-foreground truncate">
                  {record.courseName}
                </span>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    record.action === "paid"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {record.action === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <BookOpen className="w-5 h-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No courses yet —{" "}
              <span className="text-foreground font-medium">
                {courses.length} programmes
              </span>{" "}
              available.
            </p>
            <button
              type="button"
              onClick={() => onSelectTab("courses")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Browse All Courses
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
