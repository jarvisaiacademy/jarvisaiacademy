"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { Smartphone, X, CheckCircle2, Loader2 } from "lucide-react";
import { updateStudentSelfProfile } from "@/services/students-service";
import { useToast } from "@/components/ui/toast";

export interface MobilePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  currentPhone?: string | null;
  onSuccess?: (savedPhone: string) => void;
}

export function MobilePromptModal({
  isOpen,
  onClose,
  userId,
  currentPhone,
  onSuccess,
}: MobilePromptModalProps) {
  const { showToast } = useToast();
  const [phone, setPhone] = useState(() =>
    currentPhone ? currentPhone.replace(/^\+91\s*/, "").trim() : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSheet, setIsSheet] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkSheet = () => setIsSheet(window.innerWidth < 640);
    checkSheet();
    window.addEventListener("resize", checkSheet);
    return () => window.removeEventListener("resize", checkSheet);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and spaces
    const val = e.target.value.replace(/[^\d\s]/g, "");
    setPhone(val);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits) {
      setError("Please enter your mobile number.");
      return;
    }

    if (rawDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formatted = `+91 ${rawDigits}`;

    try {
      await updateStudentSelfProfile(userId, { phone: formatted });
      showToast("Mobile number saved successfully!", "success");
      onSuccess?.(formatted);
      onClose();
    } catch (err) {
      console.error("[MobilePromptModal] Failed to save mobile number:", err);
      setError("Could not save your mobile number right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-modal-title"
            tabIndex={-1}
            initial={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={isSheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            drag={isSheet ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className="relative w-full sm:max-w-[420px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl px-6 pt-3 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:p-8 shadow-2xl z-10 text-neutral-900 dark:text-neutral-100 transition-colors"
          >
            {/* Grab handle for mobile */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="sm:hidden flex justify-center pt-1 pb-3 -mx-6 cursor-grab active:cursor-grabbing touch-none"
            >
              <span className="h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-white/25" />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Header */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2
                id="mobile-modal-title"
                className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight"
              >
                Enter Mobile Number
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
                Please provide your contact number to complete your student profile and receive batch notifications.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="mobile-input"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
                >
                  Mobile Number
                </label>
                <div className="flex items-center rounded-xl border border-neutral-300 dark:border-white/15 bg-neutral-50/50 dark:bg-neutral-900/50 focus-within:border-neutral-900 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-white transition-all overflow-hidden shadow-2xs">
                  <div className="flex items-center gap-1 px-3 py-2.5 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 border-r border-neutral-200 dark:border-white/10 select-none bg-neutral-100/60 dark:bg-white/[0.04]">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    ref={inputRef}
                    id="mobile-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    disabled={isSubmitting}
                    className="flex-1 px-3.5 py-2.5 text-sm sm:text-base font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 bg-transparent outline-none tracking-wider font-mono"
                  />
                </div>

                {error && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Number...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Mobile Number</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  I&apos;ll do this later
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
