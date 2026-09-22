"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  Mail, 
  UserRound, 
  Calendar, 
  ShieldCheck, 
  Globe, 
  Link, 
  Trophy,
  Star,
  Zap,
  Code,
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
      {/* LVL100 Hero */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 rounded-2xl bg-muted/40 border border-border">
        <div className="relative">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={name}
              className="w-24 h-24 rounded-full border-2 border-background object-cover ring-4 ring-emerald-500/20"
            />
          ) : (
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-background text-foreground/80 border-2 border-border text-3xl font-bold ring-4 ring-emerald-500/20">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-background bg-emerald-500 text-white shadow-sm">
            <Trophy className="w-5 h-5" />
          </span>
        </div>
        
        <div className="flex flex-col items-center md:items-start gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground">{name}</h2>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Star className="w-3 h-3" />
              Elite
            </span>
          </div>
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Level 100 Grandmaster
          </span>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-md mt-1">
            Top 1% of Jarvis AI Academy developers. Core contributor to open source.
          </p>
          
          <div className="flex items-center gap-3 mt-3 w-full max-w-xs">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
            </div>
            <span className="text-xs font-mono font-medium text-muted-foreground">MAX</span>
          </div>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="flex flex-wrap gap-4">
        <StatBadge 
          icon={<Zap className="w-4 h-4" />}
          label="Total XP"
          value="99,999"
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <StatBadge 
          icon={<Code className="w-4 h-4" />}
          label="Projects Built"
          value="42"
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatBadge 
          icon={<Award className="w-4 h-4" />}
          label="Super10 Cohort"
          value="#1"
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
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
      
      {/* Social Links */}
      <SettingsSection title="Developer Profiles">
        <DetailRow
          icon={<Globe className="w-4 h-4" />}
          label="GitHub Profile"
          value="github.com/jarvis-elite-dev"
          badge="Connected"
        />
        <DetailRow
          icon={<Link className="w-4 h-4" />}
          label="LinkedIn Profile"
          value="linkedin.com/in/jarvis-elite-dev"
          badge="Connected"
        />
      </SettingsSection>
    </motion.div>
  );
}
