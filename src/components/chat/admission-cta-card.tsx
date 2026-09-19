"use client";

import { useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  GraduationCap,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCourses } from "@/providers/courses-provider";
import { useToast } from "@/components/ui/toast";
import { BorderGlow } from "@/components/ui/border-glow";
import {
  setAdmissionCardEffect,
  useAdmissionCardEffect,
  type AdmissionCardEffect,
} from "@/lib/admission-card-effect";
import { siteConfig } from "@/config/site";

/** The prompt that opens the admissions & enrollment checkout in this chat. */
const ENROLL_PROMPT =
  "I want to enroll in the upcoming program and proceed with payment";

/**
 * How strong the cursor spotlight gets. Tuned by rendering the card in both themes: much
 * below this the glow is washed out by the card's own surface and reads as nothing, and
 * the wide blur is doing the work of keeping it light rather than a disc — a tighter blur
 * at a lower opacity shows its own edge and looks like a sticker.
 */
const SPOTLIGHT_OPACITY = 0.45;

/**
 * The candidates. "Brand" is BorderGlow retinted to the project's own palette and "Library" is
 * the same component wearing the colours it ships with, so the retint can be judged against the
 * original rather than in the abstract. "Loop" leaves the cone turning on its own — always lit,
 * no pointer needed — and "Cycle" does that while taking the brand orange and the logo's blues
 * in turn. The library palette is left out of that rotation: its glow is a cream that disappears
 * against a white card, so it would go dark for a third of every cycle in light mode.
 */
const CARD_EFFECTS: { id: AdmissionCardEffect; label: string }[] = [
  { id: "orb", label: "Orb" },
  { id: "border", label: "Brand" },
  { id: "library", label: "Library" },
  { id: "loop", label: "Loop" },
  { id: "cycle", label: "Cycle" },
];

/**
 * The picker is scaffolding for choosing between the candidates, so it is off in the shipped UI.
 * The choice is no longer kept per browser — `DEFAULT_EFFECT` in the effect store is what ships,
 * for everybody. Set this back to true to put the comparison in front of a reviewer again.
 */
const SHOW_EFFECT_SWITCH = false;

interface AdmissionCtaCardProps {
  /** Sends `ENROLL_PROMPT` — the same prompt the enrollment portal answers. */
  onActionPrompt?: (prompt: string) => void;
}

/**
 * Picks which hover effect the card wears. Temporary: it exists so the candidates can be
 * compared in the running app, and comes out once one of them is chosen.
 */
function CardEffectSwitch({ value }: { value: AdmissionCardEffect }) {
  return (
    <div
      role="group"
      aria-label="Card hover effect"
      className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full border border-neutral-200/80 bg-neutral-100/70 p-0.5 dark:border-white/10 dark:bg-white/[0.06]"
    >
      {CARD_EFFECTS.map((effect) => {
        const selected = effect.id === value;
        return (
          <button
            key={effect.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setAdmissionCardEffect(effect.id)}
            className={`cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
              selected
                ? "bg-white text-neutral-900 shadow-2xs dark:bg-white/15 dark:text-white"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {effect.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The closing nudge under every answer: a single, reusable route into admissions,
 * so a candidate never has to work out how to enrol.
 *
 * Styled as an inline card rather than a banner: a soft gradient surface, a faint wash
 * of the brand accent and a hairline sheen along the top give it depth, while the
 * monochrome primary button keeps it inside the chat's own design language instead of
 * reading as an advertisement dropped into the transcript. Every number it shows comes
 * from the course catalogue rather than being restated here, so it cannot drift from
 * the courses page.
 *
 * On pointer devices a warm spot trails the cursor across the surface — a hover flourish
 * layered on top of that static styling, never the thing carrying it, so a touch device or
 * a reader who has asked for reduced motion still gets the finished card.
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

  // The spotlight tracks the pointer through motion values rather than state, so moving
  // the mouse across the card never re-renders it.
  //
  // Nothing is subscribed at the window: the effect is driven entirely by the card's own
  // pointer events, so a transcript with a dozen of these cards costs no global listeners
  // and leaves nothing to clean up. Mouse only — a touch would otherwise flash the glow
  // on every tap, including a tap on the buttons inside it.
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const orbX = useSpring(pointerX, { stiffness: 260, damping: 30, mass: 0.5 });
  const orbY = useSpring(pointerY, { stiffness: 260, damping: 30, mass: 0.5 });
  const orbOpacity = useSpring(0, { stiffness: 220, damping: 30 });

  const trackPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return false;
      const rect = event.currentTarget.getBoundingClientRect();
      pointerX.set(event.clientX - rect.left);
      pointerY.set(event.clientY - rect.top);
      return true;
    },
    [pointerX, pointerY]
  );

  // The spot is placed on enter as well as on move: entering from the bottom-right would
  // otherwise fade the glow in at the card's top-left corner, where the motion values still
  // sit, and let it spring across to the cursor.
  const handlePointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!trackPointer(event)) return;
      orbOpacity.set(SPOTLIGHT_OPACITY);
    },
    [trackPointer, orbOpacity]
  );

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      orbOpacity.set(0);
    },
    [orbOpacity]
  );

  const effect = useAdmissionCardEffect();

  // Only the live effect gets to listen: the two are alternatives, and leaving the orb's
  // handlers attached in border mode would fire a spotlight nobody asked to see.
  const spotlight =
    reduceMotion || effect !== "orb"
      ? {}
      : {
          onPointerMove: trackPointer,
          onPointerEnter: handlePointerEnter,
          onPointerLeave: handlePointerLeave,
        };

  // The gap above the card moves to whichever element is outermost: left on the section in
  // border mode it would sit inside the glow wrapper, and every glow layer — which is inset
  // from the wrapper's box — would be drawn a margin's height too high.
  const card = (
    <section
      aria-label="Admissions"
      className={`relative isolate w-full overflow-hidden rounded-3xl border border-neutral-200/90 bg-gradient-to-b from-white via-white to-neutral-50 p-4 shadow-xs after:pointer-events-none after:absolute after:inset-x-6 after:top-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-neutral-900/[0.07] after:to-transparent dark:border-white/10 dark:from-[#1e1e1e] dark:via-[#1a1a1a] dark:to-[#151515] dark:after:via-white/[0.09] ${
        effect === "orb" ? "mt-4" : ""
      }`}
      {...spotlight}
    >
      {/* The one warm surface in the transcript: a soft wash of the brand accent bled
          off the top-left corner. Kept to a tint so the card still reads as part of the
          neutral palette rather than an advertisement dropped into the conversation. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 h-48 w-48 rounded-full bg-[#9d5932]/[0.10] blur-3xl dark:bg-[#ea580c]/[0.12]"
      />

      {/* The spotlight that trails the cursor. Offset by half its own size so the motion
          values can be the raw cursor position, which leaves them free of the transform
          Tailwind's translate utilities would fight it for. Painted above the corner wash
          and below the copy, and blended so it lights the surface instead of covering it. */}
      {effect === "orb" && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-22 -top-22 h-44 w-44 rounded-full bg-[linear-gradient(90deg,#9d5932,#d97757)] blur-[56px] mix-blend-multiply dark:bg-[linear-gradient(90deg,#ea580c,#f59e0b)] dark:mix-blend-screen"
          style={{ x: orbX, y: orbY, opacity: orbOpacity }}
        />
      )}

      <div className="relative">
        {/* Wraps so the effect switch can drop to its own line when it is shown: its buttons
            together are wider than the space left beside the copy on a 375px screen, and the
            minimum width on the copy is what makes that break happen instead of the title being
            squeezed thinner. */}
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#9d5932]/25 bg-[#9d5932]/10 text-[#9d5932] shadow-2xs dark:border-[#ea580c]/25 dark:bg-[#ea580c]/15 dark:text-[#fb923c]">
            <GraduationCap className="h-4 w-4" />
          </div>

          <div className="min-w-32 flex-1">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              The next batch is filling up
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Seats are capped and each batch starts together, so places go quickly.
              Reserve yours and you could be building in days.
            </p>
          </div>

          {SHOW_EFFECT_SWITCH && <CardEffectSwitch value={effect} />}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center gap-2 rounded-xl border border-neutral-200/60 bg-gradient-to-b from-white to-neutral-50 px-3 py-2 dark:border-white/5 dark:from-white/[0.05] dark:to-white/[0.02]"
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
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-neutral-800 active:scale-98 dark:bg-white dark:text-black dark:hover:bg-neutral-200 sm:text-[13px]"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Talk to admissions</span>
          </a>
        </div>
      </div>
    </section>
  );

  if (effect === "orb") return card;

  // The library's own demo runs a 40px glow, which is wider than the 16px gutter the card gets
  // inside the transcript on a phone — faithfully reproduced here so the comparison is honest,
  // but it is the one thing about that variant that cannot ship as-is.
  const library = effect === "library";
  const cycle = effect === "cycle";

  return (
    <BorderGlow
      className={`mt-4${library ? " border-glow-card--library" : ""}${
        cycle ? " border-glow-card--cycle" : ""
      }`}
      // Matches `rounded-3xl`, which this project retunes to 22px via --radius-3xl. Every
      // variant keeps it: a ring wider than the card's own radius leaves the corners doubled.
      borderRadius={22}
      glowRadius={library ? 40 : 14}
      loop={effect === "loop" || cycle}
    >
      {card}
    </BorderGlow>
  );
}
