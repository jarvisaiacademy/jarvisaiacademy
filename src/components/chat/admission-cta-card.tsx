"use client";

import {
  ArrowRight,
  CalendarClock,
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
 * catalogue rather than being restated here, so it cannot drift from the courses page.
 */
export function AdmissionCtaCard({ onActionPrompt }: AdmissionCtaCardProps) {
  const { courses } = useCourses();
  const { showToast } = useToast();

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
      className="mt-4 w-full rounded-3xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-[#191919]"
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

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
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
          </div>
        ))}
      </div>

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
