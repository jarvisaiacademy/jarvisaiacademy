"use client";

import { useState } from "react";
import { X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-[420px] bg-[#212121] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-neutral-100"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Log in or sign up
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 px-2 leading-relaxed">
                You&apos;ll get smarter responses and can upload files, images, and more.
              </p>
            </div>

            {/* Social Authentication Buttons */}
            <div className="flex flex-col gap-2.5">
              {/* Google */}
              <button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-full border border-white/15 bg-neutral-800/40 hover:bg-neutral-800 transition-colors text-sm font-medium text-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-full border border-white/15 bg-neutral-800/40 hover:bg-neutral-800 transition-colors text-sm font-medium text-white"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.64 1.35-.57.65-1.06 1.73-.93 2.75 1 .08 2.02-.5 2.64-1.25z" />
                </svg>
                <span>Continue with Apple</span>
              </button>

              {/* Phone */}
              <button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-full border border-white/15 bg-neutral-800/40 hover:bg-neutral-800 transition-colors text-sm font-medium text-white"
              >
                <Phone className="w-4 h-4 text-white" />
                <span>Continue with phone</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#212121] px-2 text-neutral-500 font-medium tracking-wider">
                  OR
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-2.5 bg-black/60 border border-white/15 rounded-full text-sm text-white placeholder:text-neutral-500 outline-none focus:border-white/40 transition-colors"
              />

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-colors shadow-md"
              >
                Continue
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
