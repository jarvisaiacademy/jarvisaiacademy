"use client";

import React, { useState } from "react";
import { Moon, Sun, Laptop, ChevronRight, X } from "lucide-react";
import { useTheme, type Theme } from "@/providers/theme-provider";
import { motion, AnimatePresence } from "motion/react";

export function AppearanceSetting() {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: { value: Theme; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      description: "Clean light appearance with bright surfaces",
      icon: <Sun className="w-5 h-5 text-amber-500" />,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Deep dark appearance with low eye-strain",
      icon: <Moon className="w-5 h-5 text-sky-400" />,
    },
  ];

  // next-themes reports `undefined` until it mounts; the default is "system".
  const effective = theme ?? "system";

  const currentLabel =
    effective === "system" ? "System" : effective === "light" ? "Light" : "Dark";

  const CurrentIcon =
    effective === "system" ? Laptop : effective === "light" ? Sun : Moon;

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
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground leading-snug">
              Appearance
            </span>
            <span className="text-xs text-muted-foreground leading-normal mt-0.5">
              {currentLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Theme Selection Modal / Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Content Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              role="dialog"
              aria-labelledby="appearance-modal-title"
              className="relative w-full sm:max-w-md bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl p-4 sm:p-5 z-10 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3
                  id="appearance-modal-title"
                  className="text-base font-semibold text-foreground"
                >
                  Appearance
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close appearance menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                {themeOptions.map((opt) => {
                  const isSelected = resolvedTheme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTheme(opt.value === systemTheme ? "system" : opt.value);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3.5 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-muted font-medium text-foreground"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border shrink-0">
                          {opt.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {opt.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {opt.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-border shrink-0">
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
