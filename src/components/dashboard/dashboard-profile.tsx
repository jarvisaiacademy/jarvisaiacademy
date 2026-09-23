"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  UserRound, 
  Calendar, 
  ShieldCheck,
  Award
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
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
    <div className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground leading-snug">{label}</span>
        <span className="text-xs text-muted-foreground leading-normal mt-0.5 truncate">
          {value || "—"}
        </span>
      </div>
      {badge && (
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded bg-foreground text-background shrink-0">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border border-border bg-card flex-1 min-w-[140px]`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colorClass} shrink-0`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

export function DashboardProfile() {
  const { user } = useAuth();

  const name = user?.name || "Jarvis Member";
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "JA";
  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "January 1, 2026";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-muted/40 border border-border">
        <div className="relative">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={name}
              className="w-24 h-24 rounded-full border-2 border-background object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-background text-foreground/80 border-2 border-border text-3xl font-bold">
              {initials}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center md:items-start gap-1.5 flex-1 justify-center h-24">
          <h2 className="text-2xl font-bold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Jarvis AI Academy Member
          </p>
        </div>
      </div>

      {/* Account details */}
      <SettingsSection title="Identity & Security">
        <DetailRow
          icon={<Mail className="w-4 h-4" />}
          label="Primary Email"
          value={user?.email || "sarwadesugatraj@gmail.com"}
          badge="Verified"
        />
        <DetailRow
          icon={<UserRound className="w-4 h-4" />}
          label="Authentication"
          value="Google OAuth"
        />
        <DetailRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Account Status"
          value="Active & Secured"
        />
        <DetailRow
          icon={<Calendar className="w-4 h-4" />}
          label="Member Since"
          value={joinedAt}
        />
      </SettingsSection>
    </motion.div>
  );
}
