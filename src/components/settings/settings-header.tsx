"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface SettingsHeaderProps {
  onBack?: () => void;
  title?: string;
}

export function SettingsHeader({
  onBack,
  title = "Settings",
}: SettingsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Jarvis AI Academy"
          title="Back to Jarvis AI Academy"
          className="p-2 -ml-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-foreground select-none">
          {title}
        </h1>
      </div>
    </header>
  );
}
