"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { SettingsSection } from "@/components/settings/settings-section";
import { referralCodeFor } from "@/data/referrals";

// Mock list of referred users
const MOCK_REFERRED_USERS = [
  { id: "1", name: "Alice Sharma", status: "Enrolled" },
  { id: "2", name: "Rahul Gupta", status: "Pending" },
  { id: "3", name: "Priya Desai", status: "Joined" },
];

export function DashboardReferrals() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || (user?.id ? referralCodeFor(user.id) : "JAR-04BPH3SW");

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Referral</h2>
          <p className="text-sm text-muted-foreground">
            Share your unique code to invite friends and track their progress.
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
              className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
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

        {/* Referred Users List */}
        <SettingsSection title={`Referred Candidates (${MOCK_REFERRED_USERS.length})`} className="w-full">
          {MOCK_REFERRED_USERS.length > 0 ? (
            <div className="flex flex-col">
              {MOCK_REFERRED_USERS.map((person, index) => (
                <div
                  key={person.id}
                  className={`flex items-center justify-between px-6 sm:px-8 py-4 sm:py-4.5 hover:bg-muted/40 transition-colors ${
                    index !== MOCK_REFERRED_USERS.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-foreground/80 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-medium text-foreground">{person.name}</span>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                      person.status === "Enrolled"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : person.status === "Joined"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground">No referrals yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                When people sign up using your code, they will appear here.
              </p>
            </div>
          )}
        </SettingsSection>
      </motion.div>
    </div>
  );
}
