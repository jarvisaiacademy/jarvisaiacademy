"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  CalendarClock,
  ChevronDown,
  GraduationCap,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCourses } from "@/providers/courses-provider";
import { useToast } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";

/** The prompt that opens the admissions & enrollment checkout in this chat. */
const ENROLL_PROMPT =
  "I want to enroll in the upcoming program and proceed with payment";

interface AdmissionCtaCardProps {
  /** Sends `ENROLL_PROMPT` — the same prompt the enrollment portal answers. */
  onActionPrompt?: (prompt: string) => void;
}

/**
 * The closing nudge under every answer: a single, reusable route into admissions,
 * so a candidate never has to work out how to enrol. Folding the details away keeps
 * it a two-line card until someone is actually interested, and every number it shows
 * comes from the course catalogue rather than being restated here.
 */
export function AdmissionCtaCard({ onActionPrompt }: AdmissionCtaCardProps) {
  const { courses } = useCourses();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  // One card per reply, so the reveal needs a per-instance id to point `aria-controls` at.
  const factsId = useId();

  const elite = courses.find((course) => course.id === "super10");
  const facts = [
    { icon: Sparkles, label: "Tuition", value: elite?.fee ?? "₹0" },
    { icon: CalendarClock, label: "Duration", value: elite?.duration ?? "60 Days" },
    { icon: ShieldCheck, label: "Placement", value: elite?.badge ?? "Assured" },
  ];

  const handleReserve = () => {
    showToast("Opening the admissions checkout...", "info");
    onActionPrompt?.(ENROLL_PROMPT);
  };

  return (
    <div className="group/cta relative mt-4 w-full max-w-xl select-none">
      {/* Gradient hairline border, lit on hover */}
      <div className="rounded-3xl bg-gradient-to-br from-[#9d5932] via-[#e2894a] to-[#9d5932] p-px transition-all duration-300 group-hover/cta:from-[#e2894a] group-hover/cta:via-[#ea580c] group-hover/cta:to-[#e2894a] group-hover/cta:shadow-[0_0_44px_-14px_rgba(234,88,12,0.55)] dark:to-[#7c4424] dark:group-hover/cta:shadow-[0_0_44px_-12px_rgba(234,88,12,0.5)]">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-white p-4 sm:p-5 dark:bg-neutral-900">
          {/* Sweep of light across the card on hover */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/cta:translate-x-full dark:via-white/[0.07]" />

          <div className="relative flex items-start gap-3.5">
            <div className="shrink-0 rounded-2xl bg-gradient-to-br from-[#9d5932] to-[#ea580c] p-2.5 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Admissions open
                </span>
                <span className="text-[10px] font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
                  Next batch
                </span>
              </div>

              <p className="mt-2 text-[15px] leading-snug font-semibold text-neutral-900 dark:text-white">
                Hurry — the next batch is filling up.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Each batch starts together, and seats are capped. Reserve yours now
                and you can be building in days.
              </p>
            </div>
          </div>

          {/* Reveal the numbers only when asked for them */}
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={factsId}
            className="relative mt-3.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
          >
            <span>What you get</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                id={factsId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                  {facts.map((fact, index) => (
                    <motion.div
                      key={fact.label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.2 }}
                      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <fact.icon className="h-3.5 w-3.5 shrink-0 text-[#9d5932] dark:text-[#e2894a]" />
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
                          {fact.label}
                        </p>
                        <p className="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {fact.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mt-3.5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleReserve}
              className="group/reserve inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#9d5932] to-[#a85a30] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-[#8a4c2a] hover:to-[#7c4424] hover:shadow-md active:scale-[0.98] dark:from-[#c2410c] dark:to-[#9a3412] dark:hover:from-[#9a3412] dark:hover:to-[#7c2d12]"
            >
              <span>Reserve My Seat</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/reserve:translate-x-0.5" />
            </button>

            <a
              href={`tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-2.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-white/10 dark:text-neutral-400 dark:hover:border-white/20 dark:hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Talk to admissions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
