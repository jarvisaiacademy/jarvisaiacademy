"use client";

import React from "react";
import { SettingsHeader } from "./settings-header";
import { SettingsSection } from "./settings-section";
import { AppearanceSetting } from "./appearance-setting";
import { LanguageSetting } from "./language-setting";
import { DataControlsSetting } from "./data-controls-setting";
import { KeyboardShortcutsSetting } from "./keyboard-shortcuts-setting";
import { ReferralCodeSetting } from "./referral-code-setting";
import { useAuth } from "@/providers/auth-provider";
import { motion } from "motion/react";

import { siteConfig } from "@/config/site";

interface SettingsPageProps {
  onBack?: () => void;
  className?: string;
}

export function SettingsPage({ onBack, className = "" }: SettingsPageProps) {
  const { isLoggedIn } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col min-h-screen w-full bg-background text-foreground ${className}`}
    >
      {/* Top Header with Back button */}
      <SettingsHeader onBack={onBack} title="Settings" />

      {/* Main Settings Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-6 py-4 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {/* General Section */}
        <SettingsSection title="General">
          <AppearanceSetting />
          <LanguageSetting />
        </SettingsSection>

        {/* Referrals Section — the whole section, heading included: `SettingsSection` draws its
            heading whether or not it has children, and a signed-out visitor has no code to see. */}
        {isLoggedIn && (
          <SettingsSection title="Referrals">
            <ReferralCodeSetting />
          </SettingsSection>
        )}

        {/* Data Controls Section */}
        <SettingsSection title="Account & Data">
          <DataControlsSetting />
        </SettingsSection>

        {/* Shortcuts Section */}
        <SettingsSection title="Shortcuts">
          <KeyboardShortcutsSetting />
        </SettingsSection>

        {/* App Info / Version Footer */}
        <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground select-none">
          <span>{siteConfig.name} for Web</span>
          <span className="text-[11px] mt-0.5 opacity-75">{siteConfig.tagline}</span>
        </div>
      </main>
    </motion.div>
  );
}

export default SettingsPage;
