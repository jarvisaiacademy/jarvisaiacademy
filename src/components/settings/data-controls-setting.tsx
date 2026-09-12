"use client";

import React, { useState } from "react";
import { ShieldCheck, ChevronRight, X, Download, Trash2, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function DataControlsSetting() {
  const [isOpen, setIsOpen] = useState(false);
  const [historyTraining, setHistoryTraining] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex items-center justify-between w-full px-4 py-3.5 text-left hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground leading-snug">
              Data controls
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Data Controls Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              role="dialog"
              aria-labelledby="data-controls-modal-title"
              className="relative w-full sm:max-w-md max-h-[85vh] flex flex-col bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl p-4 sm:p-5 z-10 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                <h3
                  id="data-controls-modal-title"
                  className="text-base font-semibold text-foreground"
                >
                  Data controls
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close data controls"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col divide-y divide-border pt-2 text-sm">
                {/* Chat history & training */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex flex-col pr-4">
                    <span className="font-medium text-foreground">
                      Chat history & training
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Save new chats on this browser to your history and allow them to be used to improve our models.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryTraining((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      historyTraining ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                        historyTraining ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Shared links */}
                <button
                  type="button"
                  className="flex items-center justify-between py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Shared links</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Export data */}
                <button
                  type="button"
                  className="flex items-center justify-between py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Export data</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Delete account */}
                <button
                  type="button"
                  className="flex items-center justify-between py-3 text-left text-destructive hover:bg-destructive/10 transition-colors rounded-lg px-1 mt-1"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium">Delete account</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
