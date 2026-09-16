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
 * so a candidate never has to work out how to enrol.
 *
 * Styled as a quiet inline card rather than a banner — flat surface, hairline border,
 * monochrome primary button — so it reads as part of the transcript instead of an
 * advertisement dropped into it. Every number it shows comes from the course
 * catalogue rather than being restated here, and the details stay folded away until
 * someone asks, which keeps the resting state to three lines.
 */
export function AdmissionCtaCard({ onActionPrompt }: AdmissionCtaCardProps) {
  const { courses } = useCourses();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  // One card per reply, so the reveal needs a per-instance id to point `aria-controls` at.
  const factsId = useId();

  // "Reserve my seat" opens the checkout, which defaults to this track — so this is the
  // price the card has to quote. Super10 is listed separately because it is the one
  // track that is free, and quoting its ₹0 as general tuition would be a false price.
  const track = courses.find((course) => course.id === "fullstack");
  const elite = courses.find((course) => course.id === "super10");
  const facts = [
    { icon: Sparkles, label: "Tuition", value: track?.fee ?? "₹30,000" },
    { icon: CalendarClock, label: "Duration", value: track?.duration ?? "60 Days" },
    {
      icon: ShieldCheck,
      label: "Super10 Elite",
      value: elite ? `${elite.fee} · 10 seats` : "₹0 · 10 seats",
    },
  ];

  const handleReserve = () => {
    showToast("Opening the admissions checkout...", "info");
    onActionPrompt?.(ENROLL_PROMPT);
  };

  return (
    <section
      aria-label="Admissions"
      className="mt-4 w-full max-w-xl rounded-3xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-[#191919]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200/70 bg-neutral-100 text-neutral-600 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
          <GraduationCap className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            The next batch is filling up
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            Seats are capped and each batch starts together, so places go quickly.
            Reserve yours and you could be building in days.
          </p>
        </div>
      </div>

      {/* Details stay folded away until someone wants them */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={factsId}
        className="mt-3 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200"
      >
        <span>What you get</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={factsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
              {facts.map((fact, index) => (
                <motion.div
                  key={fact.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04, duration: 0.18 }}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200/50 bg-neutral-50/80 px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <fact.icon className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {fact.label}
                    </p>
                    <p className="truncate text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      {fact.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleReserve}
          className="group/reserve inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-neutral-800 active:scale-98 dark:bg-white dark:text-black dark:hover:bg-neutral-200 sm:text-[13px]"
        >
          <span>Reserve my seat</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/reserve:translate-x-0.5" />
        </button>

        <a
          href={`tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200/80 hover:text-neutral-900 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Talk to admissions</span>
        </a>
      </div>
    </section>
  );
}
