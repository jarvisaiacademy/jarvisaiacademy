"use client";

import React from "react";
import { motion } from "motion/react";
import { Award, Lock } from "lucide-react";

/**
 * Certificates tab — placeholder until the admin can issue certificates
 * and the JAA-2026-XXXX serial / QR model is built.
 *
 * ponytail: no data model yet, no library needed. UIUX dev can skin this later.
 */
export function DashboardCertificates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6"
    >
      <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
        {/* Locked icon badge */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Award className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-muted border border-border">
            <Lock className="w-2.5 h-2.5 text-muted-foreground" />
          </span>
        </div>

        <div className="flex flex-col gap-2 max-w-xs">
          <h3 className="text-base font-bold text-foreground">No certificates yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Complete a course to earn your certificate. Each one comes with a unique{" "}
            <span className="font-mono font-semibold text-foreground">JAA-2026-XXXX</span>{" "}
            serial and a scannable QR code.
          </p>
        </div>

        {/* Preview skeleton of what a real certificate card will look like */}
        <div className="w-full max-w-sm mt-2 p-5 rounded-2xl border-2 border-dashed border-border bg-card opacity-40 select-none">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3.5 w-3/4 rounded-full bg-muted" />
              <div className="h-2.5 w-1/2 rounded-full bg-muted" />
              <div className="h-2.5 w-2/3 rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="h-2.5 w-24 rounded-full bg-muted" />
            <div className="w-8 h-8 rounded bg-muted" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
