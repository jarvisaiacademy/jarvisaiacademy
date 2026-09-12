"use client";

import React from "react";

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  children,
  className = "",
}: SettingsSectionProps) {
  return (
    <section className={`w-full ${className}`}>
      {title && (
        <h2 className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
          {title}
        </h2>
      )}
      <div className="flex flex-col divide-y divide-border border-y sm:border sm:rounded-2xl border-border bg-card overflow-hidden">
        {children}
      </div>
    </section>
  );
}
