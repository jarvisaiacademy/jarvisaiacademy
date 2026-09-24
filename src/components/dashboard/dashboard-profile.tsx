"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  UserRound, 
  Calendar, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { SettingsSection } from "@/components/settings/settings-section";

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
        <span className="text-sm sm:text-base font-medium text-foreground leading-snug">{label}</span>
        <span className="text-xs sm:text-sm text-muted-foreground leading-normal mt-0.5 truncate">
          {value || "—"}
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

export function DashboardProfile() {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.id);

  const name = profile?.name || user?.name || "Jarvis Member";
  const initials = name ? name.slice(0, 2).toUpperCase() : "JA";
  const avatarUrl = profile?.picture || user?.picture;
  const isSuper10 = !!profile?.is_super10;

  const rawCreated = user?.createdAt || profile?.createdAt;
  const joinedAt = rawCreated
    ? new Date(rawCreated).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "January 1, 2026";

  const emailValue = user?.email || profile?.email || "—";
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
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 p-6 sm:p-8 lg:p-10 rounded-2xl bg-muted/40 border border-border w-full shadow-xs">
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
          <p className="text-sm sm:text-base font-medium text-foreground/80 mt-1">
            {profile?.title || "Jarvis AI Academy Member"}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {emailValue} · Member since {joinedAt}
          </p>
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
