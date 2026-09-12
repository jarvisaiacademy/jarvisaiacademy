"use client";

import React, { useState } from "react";
import { Globe, ChevronRight, Check, X } from "lucide-react";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/providers/language-provider";
import { motion, AnimatePresence } from "motion/react";

export function LanguageSetting() {
  const { language, currentLanguageOption, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

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
            <Globe className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground leading-snug">
              Language
            </span>
            <span className="text-xs text-muted-foreground leading-normal mt-0.5">
              {currentLanguageOption.nativeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Language Selection Modal */}
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
              aria-labelledby="language-modal-title"
              className="relative w-full sm:max-w-md max-h-[80vh] flex flex-col bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl p-4 sm:p-5 z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
                <h3
                  id="language-modal-title"
                  className="text-base font-semibold text-foreground"
                >
                  Language
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close language menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar pt-2 pr-1">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-muted font-medium text-foreground"
                          : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {lang.nativeName}
                        </span>
                        {lang.name !== lang.nativeName && (
                          <span className="text-xs text-muted-foreground">
                            {lang.name}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
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
