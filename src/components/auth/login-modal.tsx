"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
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
  // Below `sm` the dialog is a bottom sheet, above it a centred card — the same
  // two presentations ChatGPT uses. Geometry is left to CSS; this flag only
  // picks which way the thing enters, so it can never flash the wrong shape.
  // Matches Tailwind's `sm`, and the modal only ever opens on a click, long
  // after this has settled.
  const [isSheet, setIsSheet] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 40rem)");
    const sync = () => setIsSheet(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Focus moves into the dialog so a keyboard user is not left behind on the
  // page beneath it. Kept separate from the Escape listener below, whose
  // `onClose` identity changes every parent render — focusing on each of those
  // would yank focus back off whichever control the user had reached.
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

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

          {/* Dialog: a bottom sheet below `sm`, a centred card above it. */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            tabIndex={-1}
            initial={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={isSheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSheet ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            // Dragging is confined to the handle (`dragListener={false}`): the
            // sheet scrolls if it ever outgrows the viewport, and a whole-surface
            // drag would fight that scroll.
            drag={isSheet ? "y" : false}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className="relative w-full sm:max-w-[400px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl px-6 pt-3 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:p-8 shadow-2xl z-10 text-neutral-900 dark:text-neutral-100 transition-colors"
          >
            {/* Grab handle, and the only drag surface. Below `sm` only. */}
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

            {/* Header */}
            <div className="text-center mb-6">
              <h2
                id="login-modal-title"
                className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight"
              >
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
