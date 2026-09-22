"use client";

import React from "react";
import { motion } from "motion/react";
import { Mail, UserRound, Calendar, ShieldCheck } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { SettingsSection } from "@/components/settings/settings-section";

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground leading-snug">{label}</span>
        <span className="text-xs text-muted-foreground leading-normal mt-0.5 truncate">
          {value || "—"}
        </span>
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
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6"
    >
      {/* Avatar + name hero */}
      <div className="flex flex-col items-center gap-3 py-6">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={name}
            className="w-20 h-20 rounded-full border-2 border-border object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted text-foreground/80 text-2xl font-bold">
            {initials}
          </div>
        )}
        <div className="flex flex-col items-center gap-0.5">
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <span className="text-xs text-muted-foreground">Jarvis AI Academy Student</span>
        </div>
      </div>

      {/* Account details */}
      <SettingsSection title="Account">
        <DetailRow
          icon={<Mail className="w-4 h-4" />}
          label="Email"
          value={user?.email}
        />
        <DetailRow
          icon={<UserRound className="w-4 h-4" />}
          label="Sign-in method"
          value="Google"
        />
        <DetailRow
          icon={<Calendar className="w-4 h-4" />}
          label="Member since"
          value={joinedAt}
        />
        <DetailRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Email verified"
          value={user?.emailVerified ? "Yes" : "No"}
        />
      </SettingsSection>
    </motion.div>
  );
}
