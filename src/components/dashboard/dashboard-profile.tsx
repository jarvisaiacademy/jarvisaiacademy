"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  UserRound, 
  Calendar, 
  ShieldCheck,
  Sparkles,
  Phone,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { SettingsSection } from "@/components/settings/settings-section";
import { formatDate } from "@/lib/date-format";
import { referralCodeFor, resolvedReferralCode } from "@/data/referrals";

function DotSeparator() {
  return (
    <span
      className="text-base sm:text-lg font-black text-foreground/50 select-none leading-none px-0.5"
      aria-hidden="true"
    >
      ·
    </span>
  );
}

function DetailRow({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 sm:px-8 py-4.5 sm:py-5 hover:bg-muted/30 transition-colors w-full">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-foreground/80 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm sm:text-base font-semibold text-foreground leading-snug truncate">
          {value || "—"}
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground leading-normal mt-0.5">
          {label}
        </span>
      </div>
      {badge && (
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-foreground text-background shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

export interface DashboardProfileProps {
  role?: "student" | "teacher";
  showReferralCode?: boolean;
}

export function DashboardProfile({ role, showReferralCode }: DashboardProfileProps = {}) {
  const { user, isTeacher: authIsTeacher } = useAuth();
  const { profile } = useStudentProfile(user?.id);

  const isTeacherUser =
    role !== undefined
      ? role === "teacher"
      : Boolean(authIsTeacher || user?.isTeacher || user?.role === "teacher");

  const shouldShowReferral = showReferralCode !== undefined ? showReferralCode : !isTeacherUser;

  const name = profile?.name || user?.name || "Jarvis Member";
  const initials = name ? name.slice(0, 2).toUpperCase() : "JA";
  const avatarUrl = profile?.picture || user?.picture;
  const isSuper10 = !isTeacherUser && !!profile?.is_super10;

  const rawCreated = user?.createdAt || profile?.createdAt;
  const joinedAt = formatDate(rawCreated, "1 January 2026");

  const emailValue = user?.email || profile?.email || "—";
  const phoneValue = profile?.phone || (user as { phone?: string })?.phone || "Not set";
  const referralCode =
    resolvedReferralCode(user?.id, profile?.referralCode || user?.referralCode) || "JARVIS";
  const isVerified = user?.emailVerified ?? true;
  const authProvider = user?.signInProvider === "google.com" ? "Google OAuth" : "Google Account";
  const accountStatus = profile?.status
    ? `${profile.status.charAt(0).toUpperCase()}${profile.status.slice(1)} & Secured`
    : "Active & Secured";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6"
    >
      {/* Profile Hero Card - Big & Full Width End-to-End */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 sm:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl bg-muted/40 border border-border w-full shadow-xs">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 flex-1 min-w-0">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-background object-cover shadow-xs"
              />
            ) : (
              <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-background text-foreground/80 border-2 border-border text-3xl sm:text-4xl font-bold">
                {initials}
              </div>
            )}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs"
              title="Active"
            />
          </div>
          
          <div className="flex flex-col items-center md:items-start gap-1.5 flex-1 justify-center min-h-[96px] text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{name}</h2>
              {isSuper10 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Super10 Scholar</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1.5 text-xs sm:text-sm text-muted-foreground mt-1.5">
              {shouldShowReferral && (
                <>
                  <span className="font-mono font-semibold text-foreground tracking-wider" title="Referral Code">
                    {referralCode}
                  </span>
                  <DotSeparator />
                </>
              )}
              <span className="text-foreground/90">{emailValue}</span>
              <DotSeparator />
              <span className="text-foreground/90">{phoneValue}</span>
              <DotSeparator />
              <span className="text-foreground/90">Member since {joinedAt}</span>
            </div>
          </div>
        </div>

        {/* Right side: Active & Student/Teacher badges */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:self-start shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
          {isTeacherUser ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
              <Briefcase className="w-3.5 h-3.5" />
              Teacher
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5" />
              Student
            </span>
          )}
        </div>
      </div>

      {/* Account details Card - Big & Full Width End-to-End */}
      <SettingsSection title="Identity & Security" className="w-full">
        <DetailRow
          icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Primary Email"
          value={emailValue}
          badge={isVerified ? "Verified" : undefined}
        />
        <DetailRow
          icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Mobile Number"
          value={phoneValue}
          badge={phoneValue !== "Not set" ? undefined : "Action Required"}
        />
        <DetailRow
          icon={<UserRound className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Authentication"
          value={authProvider}
        />
        <DetailRow
          icon={<ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Account Status"
          value={accountStatus}
        />
        <DetailRow
          icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
          label="Member Since"
          value={joinedAt}
        />
      </SettingsSection>
    </motion.div>
  );
}
