"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/providers/auth-provider";
import { siteConfig } from "@/config/site";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { loginWithGoogle, authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await loginWithGoogle();
      if (ok) {
        onSuccess?.();
        onClose();
      }
      // On failure the modal stays open and renders `authError` below.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-[400px] bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-neutral-900 dark:text-neutral-100 transition-colors"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">
                Log in or sign up
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 px-2 leading-relaxed">
                Join {siteConfig.name} to start your personalized learning roadmap, review programs, and access code repos.
              </p>
            </div>

            {/* Continue with Google Button */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-3 w-full py-3 px-5 rounded-full bg-white dark:bg-white text-neutral-800 dark:text-neutral-900 border border-neutral-300 dark:border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-100 active:scale-[0.98] transition-all text-sm font-semibold shadow-xs dark:shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4.5 h-4.5 shrink-0 animate-spin text-neutral-600" />
                ) : (
                  <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isSubmitting ? "Signing in…" : "Continue with Google"}</span>
              </button>

              {authError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-[11px] leading-relaxed text-red-700 dark:text-red-300"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mt-2 px-3 leading-tight">
                By continuing, you agree to our Terms &amp; Conditions and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
